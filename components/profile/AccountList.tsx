import React, { useState, useCallback, memo } from "react";
import { View } from "react-native";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import { AccountItem } from "./AccountItem";
import { AccountListModals } from "./AccountListModals";
import { router } from "expo-router";
import { AccountEmptyState } from "./AccountEmptyState";

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
    // State management
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
      null,
    );

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
