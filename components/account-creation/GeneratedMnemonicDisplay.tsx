import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../common/ActionButton";
import { CopyButton } from "../common/CopyButton";
import { styles, colors } from "../../styles/styles";

interface GeneratedMnemonicDisplayProps {
  mnemonic: string;
  onRegenerate: () => void;
  isLoading?: boolean;
}

export const GeneratedMnemonicDisplay: React.FC<
  GeneratedMnemonicDisplayProps
> = ({ mnemonic, onRegenerate, isLoading = false }) => {
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
    </View>
  );
};
