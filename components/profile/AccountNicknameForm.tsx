import React, { memo, useState } from "react";
import { View, Text, Alert } from "react-native";
import { styles } from "../../styles/styles";
import { FormInput } from "../common/FormInput";
import { ActionButton } from "../common/ActionButton";
import { updateAccountNickname } from "../../util/app-config-store";

interface AccountNicknameFormProps {
  accountId: string;
  currentNickname?: string;
  onNicknameUpdate?: (newNickname: string) => void;
}

/**
 * Form component for updating account nickname
 */
export const AccountNicknameForm = memo(
  ({
    accountId,
    currentNickname = "",
    onNicknameUpdate,
  }: AccountNicknameFormProps) => {
    const [nickname, setNickname] = useState(currentNickname);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const handleSave = async () => {
      if (isLoading) return;

      // Clear any previous errors
      setError(undefined);

      // Validate nickname
      const trimmedNickname = nickname.trim();
      if (trimmedNickname.length === 0) {
        setError("Nickname cannot be empty");
        return;
      }

      if (trimmedNickname.length > 50) {
        setError("Nickname must be 50 characters or less");
        return;
      }

      setIsLoading(true);

      try {
        const success = updateAccountNickname(accountId, trimmedNickname);

        if (success) {
          // Call the callback if provided
          onNicknameUpdate?.(trimmedNickname);

          Alert.alert(
            "Success",
            "Account nickname has been updated successfully.",
            [{ text: "OK" }],
          );
        } else {
          setError("Failed to update nickname. Account not found.");
        }
      } catch (err) {
        console.error("Error updating nickname:", err);
        setError("An unexpected error occurred while updating the nickname.");
      } finally {
        setIsLoading(false);
      }
    };

    const handleReset = () => {
      setNickname(currentNickname);
      setError(undefined);
    };

    const hasChanges = nickname.trim() !== currentNickname;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Account Nickname</Text>
        <Text style={styles.description}>
          Set a friendly name for this account to make it easier to identify.
        </Text>

        <FormInput
          label="Nickname"
          value={nickname}
          onChangeText={setNickname}
          placeholder="Enter account nickname"
          error={error}
          disabled={isLoading}
          maxLength={50}
          autoCapitalize="words"
          autoCorrect={true}
        />

        <View style={styles.actionButtonRow}>
          <ActionButton
            text="Save"
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
            isLoading={isLoading}
          />

          {hasChanges && (
            <ActionButton
              text="Reset"
              onPress={handleReset}
              disabled={isLoading}
              variant="secondary"
              style={{ marginLeft: 12 }}
            />
          )}
        </View>
      </View>
    );
  },
);

AccountNicknameForm.displayName = "AccountNicknameForm";
