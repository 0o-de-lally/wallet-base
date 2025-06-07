import React, { memo, useState } from "react";
import { View } from "react-native";
import { styles } from "../../styles/styles";
import { FormInput } from "../common/FormInput";
import { MnemonicInput } from "../common/MnemonicInput";
import { ActionButton } from "../common/ActionButton";

interface SecureStorageFormProps {
  value: string;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClearAll?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  accountId: string;
  accountName?: string;
}

export const SecureStorageForm = memo(
  ({
    value,
    onValueChange,
    onSave,
    onDelete,
    isLoading,
    disabled = false,
    accountId,
    accountName,
  }: SecureStorageFormProps) => {
    const [isMnemonicValid, setIsMnemonicValid] = useState(false);
    const [isMnemonicVerified, setIsMnemonicVerified] = useState(false);

    const handleValidationChange = (isValid: boolean, isVerified: boolean) => {
      setIsMnemonicValid(isValid);
      setIsMnemonicVerified(isVerified);
    };

    return (
      <>
        <MnemonicInput
          label="Mnemonic Phrase:"
          value={value}
          onChangeText={onValueChange}
          onValidationChange={handleValidationChange}
          placeholder="Enter your 24-word recovery phrase..."
          disabled={disabled}
          showWordCount={true}
          autoValidate={true}
        />

        <View style={styles.buttonContainer}>
          <ActionButton
            style={styles.button}
            text="Save"
            onPress={onSave}
            isLoading={isLoading && value.trim().length > 0}
            disabled={
              disabled ||
              value.trim().length === 0 ||
              !isMnemonicVerified
            }
            accessibilityLabel="Save mnemonic phrase"
            accessibilityHint={`Encrypts and saves mnemonic phrase for ${accountName || accountId}`}
          />

          <ActionButton
            text="Delete"
            style={styles.button}
            onPress={onDelete}
            isLoading={isLoading && !value.trim()}
            disabled={disabled}
            accessibilityLabel="Delete mnemonic phrase"
            accessibilityHint={`Deletes stored mnemonic phrase for ${accountName || accountId}`}
          />
        </View>
      </>
    );
  },
);

SecureStorageForm.displayName = "SecureStorageForm";
