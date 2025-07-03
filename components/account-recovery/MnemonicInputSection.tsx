import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { styles, namedColors } from "../../styles/styles";
import { MnemonicInput } from "../common/MnemonicInput";

interface MnemonicInputSectionProps {
  mnemonic: string;
  isDeriving: boolean;
  isLoading: boolean;
  onMnemonicChange: (mnemonic: string) => void;
  onMnemonicValidation: (isValid: boolean, isVerified: boolean) => void;
}

export const MnemonicInputSection: React.FC<MnemonicInputSectionProps> = ({
  mnemonic,
  isDeriving,
  isLoading,
  onMnemonicChange,
  onMnemonicValidation,
}) => {
  return (
    <>
      <MnemonicInput
        label="Recovery Phrase:"
        value={mnemonic}
        onChangeText={onMnemonicChange}
        onValidationChange={onMnemonicValidation}
        placeholder="Enter your 24-word recovery phrase..."
        disabled={isLoading || isDeriving}
        showWordCount={true}
        autoValidate={true}
      />

      {isDeriving && (
        <View style={styles.inputContainer}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 8,
            }}
          >
            <ActivityIndicator size="small" color={namedColors.blue} />
            <Text style={[styles.label]}>Deriving keys from mnemonic...</Text>
          </View>
        </View>
      )}
    </>
  );
};
