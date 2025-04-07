import React, { memo } from "react";
import { View, Text } from "react-native";
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
  profileId: string;
  accountId: string; // This will be the randomly generated ID from AccountState
  profileName?: string;
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
    profileId,
    accountId,
    profileName,
    accountName,
  }: SecureStorageFormProps) => {
    return (
      <>
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>
            Profile: {profileName || profileId}
          </Text>
          <Text style={styles.resultValue}>
            Account: {accountName || accountId}
          </Text>
          <Text style={styles.resultValue} numberOfLines={1} ellipsizeMode="middle">
            ID: {accountId}
          </Text>
        </View>

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
            accessibilityHint={`Encrypts and saves private data for ${accountName || accountId}`}
          />

          <ActionButton
            text="Delete"
            onPress={onDelete}
            isLoading={isLoading && !value.trim()}
            disabled={disabled}
            accessibilityLabel="Delete private value"
            accessibilityHint={`Deletes stored private data for ${accountName || accountId}`}
          />
        </View>
      </>
    );
  },
);

SecureStorageForm.displayName = "SecureStorageForm";
