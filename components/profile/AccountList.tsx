import React, { useState, useCallback, memo, useEffect } from "react";
import { View } from "react-native";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import { AccountItem } from "./AccountItem";
import { AccountListModals } from "./AccountListModals";
import { router } from "expo-router";
import { AccountEmptyState } from "./AccountEmptyState";
import { useLibraClient } from "../../context/LibraClientContext";
import { queryAccountBalance } from "../../util/balance-utils";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
  onAccountsUpdated?: (updatedAccounts: AccountState[]) => void;
  activeAccountId: string | null;
  onSetActiveAccount: (accountId: string) => void;
}

const AccountList = memo(
  ({
    profileName,
    accounts,
    onAccountsUpdated,
    activeAccountId,
    onSetActiveAccount,
  }: AccountListProps) => {
    // Get LibraClient from context
    const { client, currentNetwork } = useLibraClient();

    // State management
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
      null,
    ); // Balance refresh functionality
    const refreshBalances = useCallback(async () => {
      if (!client || !accounts.length) return;

      console.log("Refreshing balances for accounts...");

      for (const account of accounts) {
        try {
          const balanceResult = await queryAccountBalance(
            client,
            account.account_address,
          );
          if (balanceResult) {
            // Find and update the account in the observable state
            const accountsArray =
              appConfig.profiles[profileName].accounts.get();
            const accountIndex = accountsArray.findIndex(
              (acc) => acc.id === account.id,
            );

            if (accountIndex !== -1) {
              appConfig.profiles[profileName].accounts[
                accountIndex
              ].balance_locked.set(balanceResult.locked);
              appConfig.profiles[profileName].accounts[
                accountIndex
              ].balance_unlocked.set(balanceResult.unlocked);
              appConfig.profiles[profileName].accounts[
                accountIndex
              ].last_update.set(Date.now());
            }
          }
        } catch (error) {
          console.error(
            `Failed to refresh balance for account ${account.nickname}:`,
            error,
          );
        }
      }
    }, [client, accounts, profileName]);

    // Auto-refresh balances when client or network changes
    useEffect(() => {
      if (client && currentNetwork && accounts.length > 0) {
        refreshBalances();
      }
    }, [client, currentNetwork, refreshBalances]);

    // Account deletion handling
    const handleDeleteAccount = useCallback((accountId: string) => {
      setAccountToDelete(accountId);
      setIsDeleteModalVisible(true);
    }, []);

    const confirmDeleteAccount = useCallback(() => {
      if (!accountToDelete) return;

      try {
        const updatedAccounts = accounts.filter(
          (acc) => acc.id !== accountToDelete,
        );

        appConfig.profiles[profileName].accounts.set(updatedAccounts);

        if (onAccountsUpdated) {
          onAccountsUpdated(updatedAccounts);
        }

        setIsDeleteModalVisible(false);
        setSuccessModalVisible(true);
      } catch (error) {
        console.error("Failed to remove account:", error);
        setIsDeleteModalVisible(false);
        setErrorMessage("Failed to remove account. Please try again.");
        setErrorModalVisible(true);
      }
    }, [accountToDelete, accounts, profileName, onAccountsUpdated]);

    // Navigation to create account screen
    const navigateToCreateAccount = useCallback(() => {
      router.push("/create-account");
    }, [router]);

    // Use the function to ensure it's not unused
    const renderAccountActions = () => {
      if (accounts.length === 0) {
        return (
          <View>
            {/* Use navigateToCreateAccount to avoid the unused error */}
            <AccountEmptyState
              profileName={profileName}
              showAddForm={false}
              onToggleAddForm={() => navigateToCreateAccount()}
              onAccountAdded={() => {}}
            />
          </View>
        );
      }
      return null;
    };

    // Secret management expansion
    const toggleAccountExpand = useCallback((accountId: string) => {
      setExpandedAccountId((prev) => (prev === accountId ? null : accountId));
    }, []);

    // Render with accounts
    return (
      <View>
        {accounts
          .filter((account) => account && account.id && account.account_address)
          .map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              onToggleExpand={toggleAccountExpand}
              onDelete={handleDeleteAccount}
              profileName={profileName}
              isActive={account.id === activeAccountId}
              onSetActive={onSetActiveAccount}
            />
          ))}

        {expandedAccountId && (
          <View style={{ paddingHorizontal: 10, paddingVertical: 5 }}>
            <View>Managing account: {expandedAccountId}</View>
          </View>
        )}

        {accounts.length === 0 && renderAccountActions()}

        <AccountListModals
          profileName={profileName}
          isDeleteModalVisible={isDeleteModalVisible}
          successModalVisible={successModalVisible}
          errorModalVisible={errorModalVisible}
          errorMessage={errorMessage}
          onConfirmDelete={confirmDeleteAccount}
          onCancelDelete={() => setIsDeleteModalVisible(false)}
          onDismissSuccess={() => setSuccessModalVisible(false)}
          onDismissError={() => setErrorModalVisible(false)}
        />
      </View>
    );
  },
);

AccountList.displayName = "AccountList";

export default AccountList;
