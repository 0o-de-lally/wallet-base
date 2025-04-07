import React, { useState, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import { ActionButton } from "../common/ActionButton";
import { AccountItem } from "./AccountItem";
import { AccountListModals } from "./AccountListModals";
import { styles } from "../../styles/styles";
import { router } from "expo-router";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
  onAccountsUpdated?: (updatedAccounts: AccountState[]) => void;
}

const AccountList = memo(
  ({ profileName, accounts, onAccountsUpdated }: AccountListProps) => {
    // State management
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

    // Account deletion handling
    const handleDeleteAccount = useCallback((accountAddress: string) => {
      setAccountToDelete(accountAddress);
      setIsDeleteModalVisible(true);
    }, []);

    const confirmDeleteAccount = useCallback(() => {
      if (!accountToDelete) return;

      try {
        const updatedAccounts = accounts.filter(
          (acc) => acc.account_address !== accountToDelete,
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
    }, []);

    // Secret management expansion
    const toggleAccountExpand = useCallback((accountId: string) => {
      setExpandedAccountId((prev) => (prev === accountId ? null : accountId));
    }, []);

    // Render with accounts
    return (
      <View>
        {accounts.map((account) => (
          <AccountItem
            key={account.id || account.account_address}
            account={account}
            onToggleExpand={toggleAccountExpand}
            onDelete={handleDeleteAccount}
            isExpanded={expandedAccountId === account.id}
            profileName={profileName}
          />
        ))}

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
