import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const handleCopyAddress = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(address);
        Alert.alert("Copied", "Address copied to clipboard");
      } else {
        Alert.alert("Error", "Clipboard not available");
      }
    } catch {
      Alert.alert("Error", "Failed to copy address");
    }
  };

  const handleCopyMnemonic = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(mnemonic);
        Alert.alert("Copied", "Recovery phrase copied to clipboard");
      } else {
        Alert.alert("Error", "Clipboard not available");
      }
    } catch {
      Alert.alert("Error", "Failed to copy recovery phrase");
    }
  };

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
        <Text style={styles.label}>Account Address</Text>
        <View style={styles.input}>
          <Text style={[styles.description, { fontFamily: "monospace", fontSize: 12 }]} numberOfLines={2}>
            {address}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 5 }]}
          onPress={handleCopyAddress}
          disabled={isLoading}
        >
          <Ionicons name="copy" size={16} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}> Copy Address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Recovery Phrase</Text>
        <View style={styles.input}>
          <Text style={[styles.description, { fontFamily: "monospace", lineHeight: 20 }]}>
            {mnemonic}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 5 }]}
          onPress={handleCopyMnemonic}
          disabled={isLoading}
        >
          <Ionicons name="copy" size={16} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}> Copy Recovery Phrase</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.secondaryButton, { flex: 1, marginRight: 5 }]}
          onPress={onBack}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1, marginLeft: 5 }]}
          onPress={onConfirm}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
