import React, { useState, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../styles/styles";
import { SectionContainer } from "../../common/SectionContainer";
import { ActionButton } from "../../common/ActionButton";
import { reportErrorAuto } from "../../../util/error-utils";
import type { AccountState } from "../../../util/app-config-store";

interface V8MigrationProps {
  account: AccountState;
  accountId: string;
  onRequestMnemonic: (operation: "v8_rejoin") => void;
  showAlert: (title: string, message: string) => void;
  isLoading: boolean;
}

export const V8Migration = memo(
  ({
    account,
    accountId,
    onRequestMnemonic,
    showAlert,
    isLoading,
  }: V8MigrationProps) => {
    const [migrationError, setMigrationError] = useState<string | null>(null);

    // Handle V8 RE-JOIN transaction initiation
    const handleV8Migration = useCallback(async () => {
      if (!account) {
        return;
      }

      setMigrationError(null);

      try {
        // Check if account has stored keys
        if (!account.is_key_stored) {
          showAlert(
            "No Private Key",
            "This account doesn't have a stored private key. V8 migration requires access to private keys.",
          );
          return;
        }

        // Request mnemonic reveal to get private key for migration transaction
        onRequestMnemonic("v8_rejoin");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setMigrationError(errorMessage);
        reportErrorAuto("V8Migration.handleV8Migration", error, {
          accountId,
        });
      }
    }, [account, accountId, onRequestMnemonic, showAlert]);

    return (
      <SectionContainer title="Founder Migration">
        <View style={[styles.inputContainer, styles.warningContainer]}>
          <View style={styles.iconTextHeader}>
            <Ionicons name="warning-outline" size={20} color="#FCA5A5" />
            <Text
              style={[
                styles.label,
                styles.iconTextLabel,
                styles.iconTextLabelDanger,
              ]}
            >
              Migration Required
            </Text>
          </View>
          <Text style={styles.description}>
            Looks like you have an early &ldquo;Founder&rdquo; account, which
            needs to be migrated to the V8 network. This policy was chosen to
            ensure all Founders start on equal footing.
          </Text>
          <Text style={styles.label}>Migration Process</Text>
          <Text style={styles.description}>
            1. By sending this &ldquo;migrate&rdquo; transaction you will update
            your account to the new V8 network state.
          </Text>
          <Text style={styles.description}>
            2. As a Founder your account will require anti-bot
            &ldquo;vouching&rdquo; from other Founder accounts. You can do this
            after sending the &ldquo;migrate transaction.&rdquo;
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Start Migration"
            onPress={handleV8Migration}
            isLoading={isLoading}
            disabled={isLoading || !account.is_key_stored}
            accessibilityLabel="Execute V8 network migration transaction"
          />
        </View>

        {migrationError && (
          <View style={[styles.inputContainer, styles.viewOnlyContainer]}>
            <Text style={styles.errorText}>{migrationError}</Text>
          </View>
        )}

        {!account.is_key_stored && (
          <View style={[styles.inputContainer, styles.viewOnlyContainer]}>
            <View style={styles.iconTextHeader}>
              <Ionicons name="eye-outline" size={20} color="#FCA5A5" />
              <Text
                style={[
                  styles.label,
                  styles.iconTextLabel,
                  styles.iconTextLabelDanger,
                ]}
              >
                View-Only Account
              </Text>
            </View>
            <Text style={styles.description}>
              V8 migration requires access to private keys. This view-only
              account cannot perform the migration. You&apos;ll need to import
              the private keys first.
            </Text>
          </View>
        )}
      </SectionContainer>
    );
  },
);

V8Migration.displayName = "V8Migration";
