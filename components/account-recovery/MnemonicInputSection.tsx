import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { styles, namedColors } from "../../styles/styles";
import { MnemonicInput } from "../common/MnemonicInput";
import { RecoveryState, RecoveryActions } from "./types";

interface MnemonicInputSectionProps {
  state: RecoveryState;
  actions: RecoveryActions;
  onMnemonicValidation: (isValid: boolean, isVerified: boolean) => void;
}

export const MnemonicInputSection: React.FC<MnemonicInputSectionProps> = ({
  state,
  actions,
  onMnemonicValidation,
}) => {
  return (
    <>
      <MnemonicInput
        label="Recovery Phrase:"
        value={state.mnemonic}
        onChangeText={actions.setMnemonic}
        onValidationChange={onMnemonicValidation}
        placeholder="Enter your 24-word recovery phrase..."
        disabled={state.isLoading || state.isDeriving}
        showWordCount={true}
        autoValidate={true}
      />

      {state.isDeriving && (
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
