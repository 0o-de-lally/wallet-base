import React, { useState, useRef, useCallback, memo } from "react";
import { View } from "react-native";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import AddAccountForm from "./AddAccountForm";
import type { AddAccountFormRef } from "./AddAccountForm";
import { ActionButton } from "../common/ActionButton";
import { AccountItemWithContext } from "./AccountItem";
import { AccountEmptyState } from "./AccountEmptyState";
import { AccountListModals } from "./AccountListModals";

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
    const [showAddAccountForm, setShowAddAccountForm] = useState(false);
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
      null,
    );
    const addAccountFormRef = useRef<AddAccountFormRef>(null);

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

    // Form handling
    const toggleAddAccountForm = useCallback(() => {
      setShowAddAccountForm((prev) => !prev);
    }, []);

    const handleSuccess = useCallback(() => {
      setSuccessModalVisible(false);
      setShowAddAccountForm(false);
      addAccountFormRef.current?.resetForm();
    }, []);

    // Secret management expansion
    const toggleAccountExpand = useCallback((accountId: string) => {
      setExpandedAccountId((prev) => (prev === accountId ? null : accountId));
    }, []);

    // Empty state handling
    if (accounts.length === 0) {
      return (
        <AccountEmptyState
          profileName={profileName}
          showAddForm={showAddAccountForm}
          onToggleAddForm={toggleAddAccountForm}
          onAccountAdded={handleSuccess}
          formRef={addAccountFormRef}
        />
      );
    }

    // Render with accounts
    return (
      <View>
        <ActionButton
          text={showAddAccountForm ? "Cancel" : "Add Account"}
          onPress={toggleAddAccountForm}
          accessibilityLabel={
            showAddAccountForm ? "Cancel adding account" : "Add a new account"
          }
        />

        {showAddAccountForm && (
          <AddAccountForm
            profileName={profileName}
            onComplete={() => setShowAddAccountForm(false)}
            ref={addAccountFormRef}
          />
        )}

        {accounts.map((account) => (
          <AccountItemWithContext
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
