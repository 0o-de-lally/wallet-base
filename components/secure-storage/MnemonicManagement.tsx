import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { SecretReveal } from "./SecretReveal";

// Local styles for vertical button layout
const localStyles = StyleSheet.create({
  verticalButtonContainer: {
    flexDirection: "column",
    marginTop: 28,
    marginBottom: 36,
  },
  verticalButton: {
    marginHorizontal: 0,
    marginVertical: 8,
    width: "100%",
    // Only include layout styles, let ActionButton handle color/appearance
    paddingVertical: styles.button.paddingVertical,
    paddingHorizontal: styles.button.paddingHorizontal,
    borderRadius: styles.button.borderRadius,
    alignItems: "center" as const,
  },
});

interface MnemonicManagementProps {
  accountId: string;
  accountName?: string;
  isLoading: boolean;
  disabled?: boolean;
  onRotateMnemonic: () => void;
  onClearAll: () => void;
}

export const MnemonicManagement = memo(
  ({
    accountId,
    accountName,
    isLoading,
    disabled = false,
    onRotateMnemonic,
    onClearAll,
  }: MnemonicManagementProps) => {

    return (
      <View>
        <Text style={[styles.label, { marginBottom: 16 }]}>
          Mnemonic Management for {accountName || accountId}
        </Text>

        <Text style={[styles.description, { marginBottom: 20 }]}>
          This account already has a saved mnemonic phrase. Choose an action
          below:
        </Text>

        <View style={localStyles.verticalButtonContainer}>
          <ActionButton
            text="Rotate Mnemonic"
            onPress={onRotateMnemonic}
            isLoading={isLoading}
            disabled={disabled}
            style={localStyles.verticalButton}
            accessibilityLabel="Replace mnemonic phrase"
            accessibilityHint="Replace the current mnemonic phrase with a new one"
          />

          <ActionButton
            text="Clear Account Data"
            onPress={onClearAll}
            isLoading={isLoading}
            disabled={disabled}
            isDestructive={true}
            style={localStyles.verticalButton}
            accessibilityLabel="Clear account data"
            accessibilityHint="Permanently delete the stored mnemonic phrase for this account only"
          />
        </View>

        <SecretReveal
          accountId={accountId}
          accountName={accountName}
        />
      </View>
    );
  },
);

MnemonicManagement.displayName = "MnemonicManagement";
