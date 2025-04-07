import React, { useState, useRef, useCallback, memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import ConfirmationModal from "../modal/ConfirmationModal";
import AddAccountForm from "./AddAccountForm";
import type { AddAccountFormRef } from "./AddAccountForm";
import { ActionButton } from "../common/ActionButton";
import { SecureStorageForm } from "../secure-storage/SecureStorageForm";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { ModalProvider } from "../../context/ModalContext";
import { PinInputModal } from "../pin-input/PinInputModal";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
  onAccountsUpdated?: (updatedAccounts: AccountState[]) => void;
}

const AccountList = memo(
  ({ profileName, accounts, onAccountsUpdated }: AccountListProps) => {
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showAddAccountForm, setShowAddAccountForm] = useState(false);
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
    const addAccountFormRef = useRef<AddAccountFormRef>(null);

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

    const toggleAddAccountForm = useCallback(() => {
      setShowAddAccountForm((prev) => !prev);
    }, []);

    const handleSuccess = useCallback(() => {
      setSuccessModalVisible(false);
      setShowAddAccountForm(false);
      addAccountFormRef.current?.resetForm();
    }, []);

    const toggleAccountExpand = useCallback((accountId: string) => {
      setExpandedAccountId((prev) => (prev === accountId ? null : accountId));
    }, []);

    const AccountItem = memo(({ account }: { account: AccountState }) => {
      const isExpanded = expandedAccountId === account.id;

      const {
        value,
        setValue,
        isLoading: isSecureLoading,
        handleSave,
        handleDelete,
        pinModalVisible,
        setPinModalVisible,
        handlePinVerified,
        currentAction,
      } = useSecureStorage();

      const getPinPurpose = () => {
        switch (currentAction) {
          case "save":
            return "save";
          case "delete":
            return "delete";
          default:
            return "save";
        }
      };

      return (
        <View
          key={account.account_address}
          style={[styles.resultContainer, { marginBottom: 10 }]}
          accessible={true}
          accessibilityLabel={`Account ${account.nickname}`}
        >
          <Text style={styles.resultLabel}>{account.nickname}</Text>
          <Text
            style={styles.resultValue}
            numberOfLines={1}
            ellipsizeMode="middle"
            selectable={true}
          >
            {account.account_address}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 5,
            }}
          >
            <Text style={[styles.resultValue, { fontSize: 14 }]}>
              Locked: {formatCurrency(account.balance_locked)}
            </Text>
            <Text style={[styles.resultValue, { fontSize: 14 }]}>
              Unlocked: {formatCurrency(account.balance_unlocked)}
            </Text>
          </View>
          <Text
            style={[
              styles.resultValue,
              { fontSize: 12, color: "#8c8c9e", marginTop: 5 },
            ]}
          >
            Last updated: {formatTimestamp(account.last_update)}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: account.is_key_stored ? "#a5d6b7" : "#b3b8c3",
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              accessibilityLabel={
                account.is_key_stored
                  ? "Full access account"
                  : "View only account"
              }
            >
              <Text style={{
                color: '#fff',
                fontWeight: '500',
                fontSize: 12
              }}>
                {account.is_key_stored ? "Full Access" : "View Only"}
              </Text>
            </View>

            <ActionButton
              text={isExpanded ? "Hide Secret" : "Manage Secret Key"}
              onPress={() => toggleAccountExpand(account.id)}
              size="small"
              style={{
                backgroundColor: isExpanded ? "#6c757d" : "#4a90e2"
              }}
              accessibilityLabel={`${isExpanded ? "Hide" : "Show"} secret management for ${account.nickname}`}
            />

            <ActionButton
              text="Remove"
              onPress={() => handleDeleteAccount(account.account_address)}
              isDestructive={true}
              size="small"
              accessibilityLabel={`Remove account ${account.nickname}`}
            />
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <SecureStorageForm
                value={value}
                onValueChange={setValue}
                onSave={handleSave}
                onDelete={handleDelete}
                isLoading={isSecureLoading}
                profileId={profileName}
                accountId={account.id}
                profileName={profileName}
                accountName={account.nickname}
              />
            </View>
          )}

          <PinInputModal
            visible={pinModalVisible}
            onClose={() => setPinModalVisible(false)}
            onPinVerified={handlePinVerified}
            purpose={getPinPurpose()}
          />
        </View>
      );
    });

    const renderAccountItem = useCallback(
      (account: AccountState) => (
        <ModalProvider key={account.id}>
          <AccountItem account={account} />
        </ModalProvider>
      ),
      [handleDeleteAccount, expandedAccountId, toggleAccountExpand, profileName],
    );

    const renderEmptyState = useCallback(() => {
      if (accounts.length > 0) return null;

      return (
        <View style={styles.content}>
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
              onComplete={handleSuccess}
              ref={addAccountFormRef}
            />
          )}
        </View>
      );
    }, [
      accounts.length,
      showAddAccountForm,
      profileName,
      toggleAddAccountForm,
      handleSuccess,
    ]);

    if (accounts.length === 0) {
      return renderEmptyState();
    }

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

        {accounts.map(renderAccountItem)}

        <ConfirmationModal
          visible={isDeleteModalVisible}
          title="Delete Account"
          message={`Are you sure you want to remove this account from "${profileName}"?`}
          confirmText="Delete"
          onConfirm={confirmDeleteAccount}
          onCancel={() => setIsDeleteModalVisible(false)}
          isDestructive={true}
        />

        <ConfirmationModal
          visible={successModalVisible}
          title="Success"
          message="Account has been removed from this profile."
          confirmText="OK"
          onConfirm={() => setSuccessModalVisible(false)}
          onCancel={() => setSuccessModalVisible(false)}
        />

        <ConfirmationModal
          visible={errorModalVisible}
          title="Error"
          message={errorMessage}
          confirmText="OK"
          onConfirm={() => setErrorModalVisible(false)}
          onCancel={() => setErrorModalVisible(false)}
        />
      </View>
    );
  },
);

AccountList.displayName = "AccountList";

export default AccountList;
