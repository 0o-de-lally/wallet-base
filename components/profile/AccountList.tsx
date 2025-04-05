import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import ConfirmationModal from "../modal/ConfirmationModal";
import AddAccountForm from "./AddAccountForm";
import type { AddAccountFormRef } from "./AddAccountForm";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
  onAccountsUpdated?: (updatedAccounts: AccountState[]) => void;
}

const AccountList = ({
  profileName,
  accounts,
  onAccountsUpdated,
}: AccountListProps) => {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const addAccountFormRef = useRef<AddAccountFormRef>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = (accountAddress: string) => {
    setAccountToDelete(accountAddress);
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteAccount = () => {
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
  };

  const toggleAddAccountForm = () => {
    setShowAddAccountForm(!showAddAccountForm);
  };

  const handleSuccess = () => {
    setSuccessModalVisible(false);
    setError(null);
    setShowAddAccountForm(false);
    addAccountFormRef.current?.resetForm();
  };

  if (accounts.length === 0) {
    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.button]}
          onPress={toggleAddAccountForm}
        >
          <Text style={styles.buttonText}>
            {showAddAccountForm ? "Cancel" : "Add Account"}
          </Text>
        </TouchableOpacity>
        {showAddAccountForm && (
          <AddAccountForm
            profileName={profileName}
            onComplete={() => handleSuccess()}
            ref={addAccountFormRef}
          />
        )}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.button]}
        onPress={toggleAddAccountForm}
      >
        <Text style={styles.buttonText}>
          {showAddAccountForm ? "Cancel" : "Add Account"}
        </Text>
      </TouchableOpacity>
      {showAddAccountForm && (
        <AddAccountForm
          profileName={profileName}
          onComplete={() => setShowAddAccountForm(false)}
          ref={addAccountFormRef}
        />
      )}
      {accounts.map((account) => (
        <View
          key={account.account_address}
          style={[styles.resultContainer, { marginBottom: 10 }]}
        >
          <Text style={styles.resultLabel}>{account.nickname}</Text>
          <Text
            style={styles.resultValue}
            numberOfLines={1}
            ellipsizeMode="middle"
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
            <TouchableOpacity
              style={[
                styles.button,
                {
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: account.is_key_stored
                    ? "#a5d6b7"
                    : "#b3b8c3",
                },
              ]}
              disabled={true}
            >
              <Text style={[styles.buttonText, { fontSize: 14 }]}>
                {account.is_key_stored ? "Full Access" : "View Only"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.dangerButton,
                { paddingVertical: 8, paddingHorizontal: 12 },
              ]}
              onPress={() => handleDeleteAccount(account.account_address)}
            >
              <Text style={[styles.dangerButtonText, { fontSize: 14 }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

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
};

export default AccountList;
