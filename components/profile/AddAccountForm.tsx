import React, { useState, forwardRef, useEffect } from "react";
import { Alert, Text } from "react-native";
import { styles } from "../../styles/styles";
import { addAccountToProfile, getProfileForAccount } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { getRandomBytesAsync } from "expo-crypto";
import { uint8ArrayToBase64 } from "../../util/crypto";
import { appConfig, setActiveAccount } from "../../util/app-config-store";
import Dropdown from "../common/Dropdown";

// Remove the ref interface since we're not using imperative handle
export const AddAccountForm = () => {
  // Get all available profiles
  const profileNames = Object.keys(appConfig.profiles.get());
  const activeAccountId = appConfig.activeAccountId.get();

  // Get profile associated with active account, if any
  const activeProfileName = activeAccountId ? getProfileForAccount(activeAccountId) : null;

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
    // If no valid selection and profiles exist, select a default
    if (
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
  }, []);

  // Expose a reset method through prop callback instead of imperative handle
  const resetForm = () => {
    setAccountAddress("");
    setNickname("");
    setError(null);
    // Don't reset the selectedProfile here to persist selection
  };


  const handleAddAccount = async () => {
    // Validate inputs
    if (!accountAddress.trim()) {
      setError("Account address is required");
      return;
    }

    // Make sure a profile is selected
    if (!selectedProfile) {
      setError("Please select a profile");
      return;
    }

    try {
      // Generate a random ID for the account using crypto secure random
      const randomBytes = await getRandomBytesAsync(16); // 16 bytes = 128 bits
      const accountId = uint8ArrayToBase64(randomBytes).replace(/[/+=]/g, ""); // Create URL-safe ID

      // Create account state
      const account: AccountState = {
        id: accountId, // Add generated ID to account
        account_address: accountAddress.trim(),
        nickname:
          nickname.trim() || accountAddress.trim().substring(0, 8) + "...",
        is_key_stored: false,
        balance_locked: 0,
        balance_unlocked: 0,
        last_update: Date.now(),
      };

      // Add account to selected profile
      const success = addAccountToProfile(selectedProfile, account);

      if (success) {
        // Set as active account if there is no active account yet
        if (appConfig.activeAccountId.get() === null) {
          setActiveAccount(account.id);
        }

        setSuccessModalVisible(true);
      } else {
        setError(
          "Account already exists in this profile or profile doesn't exist."
        );
      }
    } catch (error) {
      console.error("Failed to generate account ID:", error);
      setError("Failed to create account. Please try again.");
    }
  };

  const handleSuccess = () => {
    resetForm();
    setSuccessModalVisible(false);
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
    <SectionContainer title={"Add Account"}>
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
}
