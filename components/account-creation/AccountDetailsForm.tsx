import React, { useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../common/ActionButton";
import { FormInput } from "../common/FormInput";
import Dropdown from "../common/Dropdown";
import { styles, colors } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";

interface AccountDetailsFormProps {
  onConfirm: (profileName: string, nickname: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AccountDetailsForm: React.FC<AccountDetailsFormProps> = ({
  onConfirm,
  isLoading = false,
  error,
}) => {
  const [nickname, setNickname] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("");

  // Get available profiles
  const profileNames = Object.keys(appConfig.profiles.get());

  // Initialize with first profile if not set
  React.useEffect(() => {
    if (!selectedProfile && profileNames.length > 0) {
      setSelectedProfile(profileNames[0]);
    }
  }, [profileNames, selectedProfile]);

  const handleConfirm = () => {
    if (!nickname.trim()) {
      return;
    }
    onConfirm(selectedProfile, nickname.trim());
  };

  const isValid = nickname.trim().length > 0 && selectedProfile;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Details</Text>

      <View style={styles.resultContainer}>
        <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
        <Text style={styles.description}>
          Your recovery phrase will be encrypted and stored securely using your PIN.
        </Text>
      </View>

      {profileNames.length > 1 && (
        <Dropdown
          label="Profile"
          value={selectedProfile}
          onSelect={setSelectedProfile}
          options={profileNames}
          placeholder="Select a profile"
        />
      )}

      <FormInput
        label="Account Nickname"
        value={nickname}
        onChangeText={setNickname}
        placeholder="Enter a nickname for this account"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={handleConfirm}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ActionButton
        text={isLoading ? "Creating Account..." : "Create Account"}
        onPress={handleConfirm}
        disabled={!isValid}
        isLoading={isLoading}
      />
    </View>
  );
};
