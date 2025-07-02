import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";

interface GeneratedMnemonicDisplayProps {
  mnemonic: string;
  onRegenerate: () => void;
  isLoading?: boolean;
}

export const GeneratedMnemonicDisplay: React.FC<GeneratedMnemonicDisplayProps> = ({
  mnemonic,
  onRegenerate,
  isLoading = false,
}) => {
  const handleCopy = async () => {
    try {
      // Use native Clipboard API
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(mnemonic);
        Alert.alert("Copied", "Recovery phrase copied to clipboard");
      } else {
        Alert.alert("Error", "Clipboard not available");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const mnemonicWords = mnemonic.split(" ");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Recovery Phrase</Text>

      <View style={styles.resultContainer}>
        <Ionicons name="warning" size={20} color={colors.danger} />
        <Text style={styles.description}>
          Write this down and store it safely. You'll need it to recover your account.
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        {mnemonicWords.map((word, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.label}>{index + 1}</Text>
            <Text style={styles.description}>{word}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        <TouchableOpacity
          style={[styles.secondaryButton, { flex: 1, marginRight: 5 }]}
          onPress={onRegenerate}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Generate New</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1, marginLeft: 5 }]}
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
