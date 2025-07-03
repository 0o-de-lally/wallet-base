import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
import { FormInput } from "../common/FormInput";
import { ActionButton } from "../common/ActionButton";
import { RecoveryState, RecoveryActions } from "./types";

interface AddressVerificationSectionProps {
  state: RecoveryState;
  actions: RecoveryActions;
  onVerifyOnChain: () => void;
}

export const AddressVerificationSection: React.FC<AddressVerificationSectionProps> = ({
  state,
  actions,
  onVerifyOnChain,
}) => {
  if (!state.derivedAddress) {
    return null;
  }

  return (
    <>
      <FormInput
        label="Derived Address:"
        value={state.derivedAddress.toStringLong()}
        onChangeText={() => {}} // Read-only
        placeholder="Address will appear here"
        disabled={true}
      />

      {!state.isChainVerified && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Verify the mnemonic by connecting to the blockchain. This works for
            both existing accounts and new accounts.
          </Text>
          <ActionButton
            text="Verify on Chain"
            onPress={() => {
              actions.setIsVerifyingChain(true);
              actions.setError(null);
              onVerifyOnChain();
            }}
            disabled={state.isVerifyingChain || !state.derivedAddress}
            isLoading={state.isVerifyingChain}
            accessibilityLabel="Verify address on blockchain"
            accessibilityHint="Connects to the blockchain to verify the account exists or confirm it's new"
          />
        </View>
      )}

      {state.isChainVerified && state.chainAddress && (
        <View style={styles.inputContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.label, { color: colors.success }]}>
              Chain verification successful!
              {state.chainAddress?.toStringLong() === state.derivedAddress?.toStringLong()
                ? " (Account verified or new)"
                : " (Account found with rotated keys)"}
            </Text>
          </View>
          <FormInput
            label="Actual Chain Address:"
            value={state.chainAddress.toStringLong()}
            onChangeText={() => {}} // Read-only
            placeholder="Verified address"
            disabled={true}
          />
        </View>
      )}
    </>
  );
};
