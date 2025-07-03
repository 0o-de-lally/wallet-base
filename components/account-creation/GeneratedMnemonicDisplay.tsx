import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../common/ActionButton";
import { styles, colors } from "../../styles/styles";

interface GeneratedMnemonicDisplayProps {
  mnemonic: string;
  onRegenerate: () => void;
  isLoading?: boolean;
}

export const GeneratedMnemonicDisplay: React.FC<
  GeneratedMnemonicDisplayProps
> = ({ mnemonic, onRegenerate, isLoading = false }) => {
  const handleCopy = async () => {
    try {
      // Use native Clipboard API
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(mnemonic);
        Alert.alert("Copied", "Recovery phrase copied to clipboard");
      } else {
        Alert.alert("Error", "Clipboard not available");
      }
    } catch {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 20 }}>
        <ActionButton
          text="Generate New"
          onPress={onRegenerate}
          disabled={isLoading}
          variant="secondary"
        />
      </View>

      <View style={styles.resultContainer}>
        <Ionicons name="warning" size={20} color={colors.danger} />
        <Text style={styles.description}>
          Write this down and store it safely. You&apos;ll need it to recover
          your account.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Recovery Phrase</Text>
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

      <View style={{ marginTop: 10 }}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCopy}
          disabled={isLoading}
        >
          <Ionicons name="copy" size={16} color={colors.textPrimary} />
          <Text style={styles.primaryButtonText}> Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
