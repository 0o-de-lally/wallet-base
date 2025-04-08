import React, { useState, useEffect } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { getProfileForAccount } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { appConfig } from "../../util/app-config-store";
import Dropdown from "../common/Dropdown";
import {
  createAccount,
  validateAccountAddress,
} from "../../util/account-utils";

interface AddAccountFormProps {
  profileName?: string;
  onComplete: () => void;
  onResetForm?: () => void;
}

export const AddAccountForm: React.FC<AddAccountFormProps> = ({
  profileName,
  onComplete,
  onResetForm,
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
  const [addressError, setAddressError] = useState<string | undefined>(
    undefined,
  );
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

  // Validate account address when it changes
  useEffect(() => {
    if (accountAddress.trim()) {
      const isValid = validateAccountAddress(accountAddress);
      if (!isValid) {
        setAddressError("Invalid account address format");
      } else {
        setAddressError(undefined);
      }
    } else {
      setAddressError(undefined); // Don't show error for empty field
    }
  }, [accountAddress]);

  // Expose a reset method through prop callback
  const resetForm = () => {
    setAccountAddress("");
    setNickname("");
    setError(null);
    setAddressError(undefined);
    // Don't reset the selectedProfile here to persist selection
  };

  // Call the onResetForm callback with our local resetForm function
  useEffect(() => {
    if (onResetForm) {
      onResetForm();
    }
  }, [onResetForm]);

  const handleAddAccount = async () => {
    // First validate the address
    const isValidAddress = validateAccountAddress(accountAddress);
    if (!isValidAddress) {
      setError("Invalid account address format");
      return;
    }

    const result = await createAccount(
      selectedProfile,
      accountAddress,
      nickname,
    );

    if (result.success) {
      setSuccessModalVisible(true);
    } else {
      setError(result.error || "Unknown error occurred");
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
        error={addressError}
      />
      {addressError && <Text style={styles.errorText}>{addressError}</Text>}

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
