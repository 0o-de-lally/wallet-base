import React from "react";
import { View, Text } from "react-native";
import { AccountAddress } from "open-libra-sdk";
import { CopyButton } from "../common/CopyButton";
import { styles } from "../../styles/styles";

interface GeneratedAddressDisplayProps {
  derivedAddress: AccountAddress | null;
  isDeriving: boolean;
}

export const GeneratedAddressDisplay: React.FC<
  GeneratedAddressDisplayProps
> = ({ derivedAddress, isDeriving }) => {
  if (!derivedAddress && !isDeriving) {
    return null;
  }

  return (
    <View style={styles.inputContainer}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={styles.label}>Generated Account Address</Text>
        {derivedAddress && !isDeriving && (
          <CopyButton
            text={derivedAddress.toStringLong()}
            label="Copy"
            variant="icon"
            size="small"
            accessibilityLabel="Copy generated address"
            accessibilityHint="Copy the generated account address to clipboard"
          />
        )}
      </View>

      {isDeriving ? (
        <View style={[styles.input, { padding: 16 }]}>
          <Text style={[styles.resultValue, { fontStyle: "italic" }]}>
            Deriving address...
          </Text>
        </View>
      ) : derivedAddress ? (
        <View style={[styles.input, { padding: 16 }]}>
          <Text style={[styles.resultValue, { fontFamily: "monospace" }]}>
            {derivedAddress.toStringLong()}
          </Text>
        </View>
      ) : null}

      {derivedAddress && (
        <Text style={[styles.description, { marginTop: 8, marginBottom: 0 }]}>
          This is your new account address that will be created on the
          blockchain.
        </Text>
      )}
    </View>
  );
};
