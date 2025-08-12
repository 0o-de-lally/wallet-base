import React, { useState, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../styles/styles";
import { SectionContainer } from "../../common/SectionContainer";
import { ActionButton } from "../../common/ActionButton";
import { reportErrorAuto } from "../../../util/error-utils";
import type { AccountState } from "../../../util/app-config-store";

interface AdminTransactionsProps {
  account: AccountState;
  accountId: string;
  onRequestMnemonic: (operation: "v8_rejoin") => void;
  showAlert: (title: string, message: string) => void;
  isLoading: boolean;
  isV8Authorized?: boolean;
}

export const AdminTransactions = memo(
  ({
    account,
    accountId,
    onRequestMnemonic,
    showAlert,
    isLoading,
    isV8Authorized = true,
  }: AdminTransactionsProps) => {
    const [adminTransactionError, setAdminTransactionError] = useState<
      string | null
    >(null);

    // Handle V8 RE-JOIN transaction initiation
    const handleV8Rejoin = useCallback(async () => {
      if (!account) {
        return;
      }

      setAdminTransactionError(null);

      try {
        // Check if account has stored keys
        if (!account.is_key_stored) {
          showAlert(
            "No Private Key",
            "This account doesn't have a stored private key. Admin transactions require access to private keys.",
          );
          return;
        }

        // Request mnemonic reveal to get private key for admin transaction
        onRequestMnemonic("v8_rejoin");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setAdminTransactionError(errorMessage);
        reportErrorAuto("AdminTransactions.handleV8Rejoin", error, {
          accountId,
        });
      }
    }, [account, accountId, onRequestMnemonic, showAlert]);

    return (
      <SectionContainer title="Admin Transactions">
        {!isV8Authorized && (
          <View style={[styles.inputContainer, { marginBottom: 16 }]}>
            <View style={styles.viewOnlyHeader}>
              <Ionicons name="warning-outline" size={20} color="#ff6b00" />
              <Text style={[styles.label, { color: "#ff6b00", marginLeft: 8 }]}>
                V8 Migration Required
              </Text>
            </View>
            <Text style={styles.description}>
              Your account needs to be migrated to V8. Other admin transactions
              are not available until migration is complete.
            </Text>
            <ActionButton
              text="Migrate"
              onPress={handleV8Rejoin}
              isLoading={isLoading}
              disabled={isLoading || !account.is_key_stored}
              accessibilityLabel="Execute V8 network migration transaction"
            />
          </View>
        )}

        {adminTransactionError && (
          <View>
            <Text style={styles.errorText}>{adminTransactionError}</Text>
          </View>
        )}

        {!account.is_key_stored && (
          <View style={[styles.inputContainer, styles.viewOnlyContainer]}>
            <View style={styles.viewOnlyHeader}>
              <Ionicons name="eye-outline" size={20} color="#ff9500" />
              <Text style={[styles.label, styles.viewOnlyIcon]}>
                View-Only Account
              </Text>
            </View>
            <Text style={styles.description}>
              Admin transactions require access to private keys. This view-only
              account cannot execute transactions.
            </Text>
          </View>
        )}
      </SectionContainer>
    );
  },
);

AdminTransactions.displayName = "AdminTransactions";
