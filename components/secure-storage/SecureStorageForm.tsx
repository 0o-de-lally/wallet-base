import React, { memo } from "react";
import { View } from "react-native";
import { styles } from "../../styles/styles";
import { FormInput } from "../common/FormInput";
import { ActionButton } from "../common/ActionButton";

interface SecureStorageFormProps {
  value: string;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClearAll?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const SecureStorageForm = memo(
  ({
    value,
    onValueChange,
    onSave,
    onDelete,
    isLoading,
    disabled = false,
  }: SecureStorageFormProps) => {
    return (
      <>
        <FormInput
          label="Private Value:"
          value={value}
          onChangeText={onValueChange}
          placeholder="Enter sensitive value to store"
          multiline={true}
          numberOfLines={3}
          disabled={disabled}
        />

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Save"
            onPress={onSave}
            isLoading={isLoading && value.trim().length > 0}
            disabled={disabled || value.trim().length === 0}
            accessibilityLabel="Save private value"
            accessibilityHint="Encrypts and saves your private data"
          />

          <ActionButton
            text="Delete"
            onPress={onDelete}
            isLoading={isLoading && !value.trim()}
            disabled={disabled}
            accessibilityLabel="Delete private value"
            accessibilityHint="Deletes your stored private data"
          />
        </View>
      </>
    );
  },
);

SecureStorageForm.displayName = "SecureStorageForm";
