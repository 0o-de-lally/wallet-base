import React, { useState, useEffect, useCallback } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { getProfileForAccount } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { appConfig } from "../../util/app-config-store";
import Dropdown from "../common/Dropdown";
import { createAccount } from "../../util/account-utils";
import { addressFromString } from "open-libra-sdk";

interface AddAccountFormProps {
  profileName?: string;
  onComplete: () => void;
}

const AddAccountForm: React.FC<AddAccountFormProps> = ({
  profileName,
  onComplete,
}) => {
  // Get all available profiles
  const profileNames = Object.keys(appConfig.profiles.get());
  const activeAccountId = appConfig.activeAccountId.get();

  // Get profile associated with active account, if any
  const activeProfileName = activeAccountId
    ? getProfileForAccount(activeAccountId)
    : null;

  // Initialize with active profile or first profile (never empty string)
  const [selectedProfile, setSelectedProfile] = useState<string>(() => {
    // First try to use active profile if it exists in the available profiles
    if (activeProfileName && profileNames.includes(activeProfileName)) {
      return activeProfileName;
    }
    // Otherwise use the first profile if any profiles exist
    else if (profileNames.length > 0) {
      return profileNames[0];
    }
    // Fallback in case of no profiles (though UI should prevent this case)
    return "";
  });

  const [accountAddress, setAccountAddress] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasMultipleProfiles = profileNames.length > 1;

  // State for modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Update selected profile if initial profile changes or profiles change
  useEffect(() => {
    // Only update if explicitly provided through props
    if (profileName) {
      setSelectedProfile(profileName);
    }
    // If no valid selection and profiles exist, select a default
    else if (
      (!selectedProfile || !profileNames.includes(selectedProfile)) &&
      profileNames.length > 0
    ) {
      // Prefer the active profile as default if it exists
      if (activeProfileName && profileNames.includes(activeProfileName)) {
        setSelectedProfile(activeProfileName);
      } else {
        // Otherwise use the first profile
        setSelectedProfile(profileNames[0]);
      }
    }
  }, [profileName, profileNames, activeProfileName, selectedProfile]);

  // Reset form function for internal use
  const resetForm = useCallback(() => {
    setAccountAddress("");
    setNickname("");
    setError(null);
    // Don't reset the selectedProfile here to persist selection
  }, []);

  const handleAddAccount = async () => {
    try {
      // Convert string address to AccountAddress
      const address = addressFromString(accountAddress.trim());

      const result = await createAccount(selectedProfile, address, nickname);

      if (result.success) {
        setSuccessModalVisible(true);
      } else {
        setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid account address format";
      setError(errorMessage);
    }
  };

  const handleSuccess = () => {
    setSuccessModalVisible(false);
    resetForm();
    // Call onComplete when form completes successfully
    onComplete();
  };

  // Profile selection handler - Simplified and more direct
  const handleProfileSelect = (profile: string) => {
    console.log("Profile selected in handler:", profile);
    setSelectedProfile(profile);
    setError(null); // Clear errors on profile change
  };

  // Debug the current selection state
  useEffect(() => {
    console.log("Current selected profile:", selectedProfile);
    console.log("Available profiles:", profileNames);
  }, [selectedProfile, profileNames]);

  return (
    <SectionContainer
      title={profileName ? `Add Account to ${profileName}` : "Add Account"}
    >
      {error && <Text style={styles.errorText}>{error}</Text>}

      {hasMultipleProfiles && (
        <>
          <Dropdown
            label="Profile"
            value={selectedProfile}
            options={profileNames}
            onSelect={handleProfileSelect}
            placeholder="Select a profile"
          />
        </>
      )}

      <FormInput
        label="Account Address:"
        value={accountAddress}
        onChangeText={setAccountAddress}
        placeholder="Enter account address"
      />

      <FormInput
        label="Nickname (optional):"
        value={nickname}
        onChangeText={setNickname}
        placeholder="Enter a friendly name"
      />

      <ActionButton
        text="Add Account"
        onPress={handleAddAccount}
        accessibilityLabel="Add account"
        accessibilityHint={`Adds a new account to the ${selectedProfile} profile`}
      />

      {/* Success Modal */}
      <ConfirmationModal
        visible={successModalVisible}
        title="Success"
        message={`Account added to "${selectedProfile}" successfully.`}
        confirmText="OK"
        onConfirm={handleSuccess}
        onCancel={handleSuccess}
      />
    </SectionContainer>
  );
};

AddAccountForm.displayName = "AddAccountForm";

export default AddAccountForm;
