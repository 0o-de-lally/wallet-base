import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { styles } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
}

const AccountList = ({ profileName, accounts }: AccountListProps) => {
  const handleDeleteAccount = (accountAddress: string) => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to remove this account from "${profileName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            // Filter out the account to delete
            const updatedAccounts = accounts.filter(
              (acc) => acc.account_address !== accountAddress,
            );

            // Update the profile's accounts
            appConfig.profiles[profileName].accounts.set(updatedAccounts);
          },
          style: "destructive",
        },
      ],
    );
  };

  if (accounts.length === 0) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultValue}>
          No accounts in this profile. Add one to get started.
        </Text>
      </View>
    );
  }

  return (
    <View>
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
              disabled={true} // This would link to a more detailed view
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
    </View>
  );
};

export default AccountList;
