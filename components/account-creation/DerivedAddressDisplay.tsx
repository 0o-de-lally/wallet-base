import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CopyButton } from "../common/CopyButton";
import { styles, colors } from "../../styles/styles";

interface DerivedAddressDisplayProps {
  address: string;
  mnemonic: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const DerivedAddressDisplay: React.FC<DerivedAddressDisplayProps> = ({
  address,
  mnemonic,
  onConfirm,
  onBack,
  isLoading = false,
}) => {
  return (
    <View>
      <Text style={styles.title}>Derived Account Address</Text>

      <View style={styles.resultContainer}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Text style={styles.description}>
          Your account address has been derived from the recovery phrase.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={styles.label}>Account Address</Text>
          <CopyButton
            text={address}
            label="Copy"
            variant="icon"
            size="small"
            disabled={isLoading}
            accessibilityLabel="Copy account address"
            accessibilityHint="Copy the account address to clipboard"
          />
        </View>
        <View style={styles.input}>
          <Text
            style={[
              styles.description,
              { fontFamily: "monospace", fontSize: 12 },
            ]}
            numberOfLines={2}
          >
            {address}
          </Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={styles.label}>Recovery Phrase</Text>
          <CopyButton
            text={mnemonic}
            label="Copy"
            variant="icon"
            size="small"
            disabled={isLoading}
            accessibilityLabel="Copy recovery phrase"
            accessibilityHint="Copy the recovery phrase to clipboard"
          />
        </View>
        <View style={styles.input}>
          <Text
            style={[
              styles.description,
              { fontFamily: "monospace", lineHeight: 20 },
            ]}
          >
            {mnemonic}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.secondaryButton, { width: "100%" }]}
            onPress={onBack}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.primaryButton, { width: "100%" }]}
            onPress={onConfirm}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
