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
}

export const AdminTransactions = memo(
  ({
    account,
    accountId,
    onRequestMnemonic,
    showAlert,
    isLoading,
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

    // Clear admin errors
    const clearAdminErrors = useCallback(() => {
      setAdminTransactionError(null);
    }, []);

    return (
      <SectionContainer title="Admin Transactions">
        <Text style={styles.description}>
          Administrative blockchain transactions for account management and
          network migration.
        </Text>

        <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>
          V8 Network RE-JOIN
        </Text>
        <Text style={styles.description}>
          Execute the V8 network migration transaction
          (0x1::filo_migration::maybe_migrate). This will attempt to migrate
          your account to the V8 network if eligible.
        </Text>

        {adminTransactionError && (
          <View style={[styles.inputContainer, { marginTop: 10 }]}>
            <Text style={styles.errorText}>{adminTransactionError}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Execute V8 RE-JOIN"
            onPress={handleV8Rejoin}
            isLoading={isLoading}
            disabled={isLoading || !account.is_key_stored}
            accessibilityLabel="Execute V8 network migration transaction"
          />

          <ActionButton
            text="Clear Errors"
            onPress={clearAdminErrors}
            variant="secondary"
            disabled={isLoading || !adminTransactionError}
            style={{ marginTop: 10 }}
            accessibilityLabel="Clear admin transaction errors"
          />
        </View>

        {!account.is_key_stored && (
          <View style={[styles.inputContainer, { marginTop: 16 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#ff9500" />
              <Text style={[styles.label, { marginLeft: 8, color: "#ff9500" }]}>
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
