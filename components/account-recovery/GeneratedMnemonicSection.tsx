import React, { useState, useCallback } from "react";
import { View, Text, Alert } from "react-native";
import { ActionButton } from "../common/ActionButton";
import { CopyButton } from "../common/CopyButton";
import { styles } from "../../styles/styles";
import { generateMnemonic } from "open-libra-sdk";

interface GeneratedMnemonicSectionProps {
  onMnemonicGenerated: (mnemonic: string) => void;
  isLoading?: boolean;
}

export const GeneratedMnemonicSection: React.FC<
  GeneratedMnemonicSectionProps
> = ({ onMnemonicGenerated, isLoading = false }) => {
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMnemonic = useCallback(async () => {
    setIsGenerating(true);

    try {
      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newMnemonic = generateMnemonic();
      setGeneratedMnemonic(newMnemonic);
      onMnemonicGenerated(newMnemonic);
    } catch (error) {
      console.error("Error generating mnemonic:", error);
      Alert.alert(
        "Error",
        "Failed to generate recovery words. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsGenerating(false);
    }
  }, [onMnemonicGenerated]);

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
        <Text style={styles.label}>Recovery Words</Text>
        {generatedMnemonic && (
          <CopyButton
            text={generatedMnemonic}
            label="Copy"
            variant="icon"
            size="small"
            disabled={isLoading}
            accessibilityLabel="Copy recovery words"
            accessibilityHint="Copy the recovery words to clipboard"
          />
        )}
      </View>

      {!generatedMnemonic ? (
        <View>
          <Text style={[styles.description, { marginBottom: 16 }]}>
            Generate new recovery words for your account. These words will be
            used to restore your account if needed.
          </Text>

          <ActionButton
            text="Generate Recovery Words"
            onPress={handleGenerateMnemonic}
            isLoading={isGenerating}
            disabled={isLoading}
          />
        </View>
      ) : (
        <View>
          <View style={[styles.input, { minHeight: 100, padding: 16 }]}>
            <Text
              style={[
                styles.resultValue,
                { lineHeight: 24, fontFamily: "monospace" },
              ]}
            >
              {generatedMnemonic}
            </Text>
          </View>

          <Text
            style={[styles.description, { marginTop: 12, marginBottom: 0 }]}
          >
            Write these words down in order and keep them safe. You&apos;ll need
            them to recover your account.
          </Text>

          <ActionButton
            text="Generate New Words"
            onPress={handleGenerateMnemonic}
            isLoading={isGenerating}
            disabled={isLoading}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </View>
  );
};
