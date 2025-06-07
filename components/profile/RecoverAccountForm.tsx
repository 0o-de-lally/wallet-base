import "buffer"; // Ensure Buffer is available globally
import React, { useState, useEffect } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { getProfileForAccount } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { MnemonicInput } from "../common/MnemonicInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { appConfig } from "../../util/app-config-store";
import Dropdown from "../common/Dropdown";
import { createAccount } from "../../util/account-utils";
import { LibraWallet, Network } from "open-libra-sdk";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";

interface RecoverAccountFormProps {
  profileName?: string;
  onComplete: () => void;
  onResetForm?: () => void;
}

const MainnetURL = "https://rpc.scan.openlibra.world/v1";

/**
 * Derives a short nickname from an account address
 * @param address The full account address
 * @returns A shortened version suitable for display
 */
function deriveShortNickname(address: string): string {
  // Remove '0x' prefix if present
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

  // Take first 6 characters and last 4 characters
  if (cleanAddress.length <= 10) {
    return cleanAddress;
  }

  return `${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`;
}

export const RecoverAccountForm: React.FC<RecoverAccountFormProps> = ({
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

  const [mnemonic, setMnemonic] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifiedMnemonic, setIsVerifiedMnemonic] = useState(false);
  const [derivedAddress, setDerivedAddress] = useState<string | null>(null);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const hasMultipleProfiles = profileNames.length > 1;

  // State for modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Initialize secure storage hook without an initial account (we'll set it after account creation)
  const secureStorage = useSecureStorage();

  // Update secure storage when account is created
  useEffect(() => {
    if (createdAccountId && mnemonic.trim()) {
      // Set the value in secure storage and trigger save
      secureStorage.setValue(mnemonic);
      secureStorage.handleSave(createdAccountId);
    }
  }, [createdAccountId, mnemonic, secureStorage]);

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

  // Reset derived address when mnemonic changes
  useEffect(() => {
    if (!isVerifiedMnemonic) {
      setDerivedAddress(null);
      // Reset nickname to empty when mnemonic changes
      setNickname("");
    }
  }, [isVerifiedMnemonic]);

  // Derive account address when mnemonic is verified
  useEffect(() => {
    const deriveAddress = async () => {
      if (!isVerifiedMnemonic || !mnemonic.trim()) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create wallet from mnemonic
        const wallet = LibraWallet.fromMnemonic(
          mnemonic.trim(),
          Network.MAINNET,
          MainnetURL,
        );

        // Get the account address
        const address = wallet.getAddress().toStringLong();
        setDerivedAddress(address);

        // Set default nickname if none provided
        if (!nickname.trim()) {
          setNickname(deriveShortNickname(address));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to derive address from mnemonic";
        setError(errorMessage);
        setDerivedAddress(null);
      } finally {
        setIsLoading(false);
      }
    };

    deriveAddress();
  }, [isVerifiedMnemonic, mnemonic, nickname]);

  // Expose a reset method through prop callback
  const resetForm = () => {
    setMnemonic("");
    setNickname("");
    setError(null);
    setIsVerifiedMnemonic(false);
    setDerivedAddress(null);
    // Don't reset the selectedProfile here to persist selection
  };

  // Call the onResetForm callback with our local resetForm function
  useEffect(() => {
    if (onResetForm) {
      onResetForm();
    }
  }, [onResetForm]);

  const handleRecoverAccount = async () => {
    if (!derivedAddress) {
      setError("Please enter a valid mnemonic phrase");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createAccount(
        selectedProfile,
        derivedAddress,
        nickname || deriveShortNickname(derivedAddress),
      );

      if (result.success && result.account) {
        // Store the created account ID for secure storage integration
        setCreatedAccountId(result.account.id);
        setSuccessModalVisible(true);
      } else {
        setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to recover account";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setSuccessModalVisible(false);
    resetForm();
    // Call onComplete when form completes successfully
    onComplete();
  };

  // Profile selection handler
  const handleProfileSelect = (profile: string) => {
    console.log("Profile selected in handler:", profile);
    setSelectedProfile(profile);
    setError(null); // Clear errors on profile change
  };

  // Mnemonic validation handler
  const handleMnemonicValidation = (isValid: boolean, isVerified: boolean) => {
    setIsVerifiedMnemonic(isVerified);
    setError(null); // Clear errors when validation changes
  };

  // Debug the current selection state
  useEffect(() => {
    console.log("Current selected profile:", selectedProfile);
    console.log("Available profiles:", profileNames);
  }, [selectedProfile, profileNames]);

  const canRecover = isVerifiedMnemonic && derivedAddress && !isLoading;

  return (
    <SectionContainer
      title={
        profileName ? `Recover Account to ${profileName}` : "Recover Account"
      }
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

      <MnemonicInput
        label="Recovery Phrase:"
        value={mnemonic}
        onChangeText={setMnemonic}
        onValidationChange={handleMnemonicValidation}
        placeholder="Enter your 24-word recovery phrase..."
        disabled={isLoading}
        showWordCount={true}
        autoValidate={true}
      />

      {derivedAddress && (
        <FormInput
          label="Derived Address:"
          value={derivedAddress}
          onChangeText={() => {}} // Read-only
          placeholder="Address will appear here"
          disabled={true}
        />
      )}

      <FormInput
        label="Nickname (optional):"
        value={nickname}
        onChangeText={setNickname}
        placeholder="Enter a friendly name"
        disabled={isLoading}
      />

      <ActionButton
        text="Recover Account"
        onPress={handleRecoverAccount}
        disabled={!canRecover}
        isLoading={isLoading}
        accessibilityLabel="Recover account from mnemonic"
        accessibilityHint={`Recovers an account from the mnemonic phrase and adds it to the ${selectedProfile} profile`}
      />

      {/* Success Modal */}
      <ConfirmationModal
        visible={successModalVisible}
        title="Success"
        message={`Account recovered and added to "${selectedProfile}" successfully.`}
        confirmText="OK"
        onConfirm={handleSuccess}
        onCancel={handleSuccess}
      />

      {/* PIN Input Modal for Secure Storage */}
      <PinInputModal
        visible={secureStorage.pinModalVisible}
        onClose={() => secureStorage.setPinModalVisible(false)}
        purpose="save"
        onPinAction={secureStorage.handlePinAction}
        actionTitle="Secure Mnemonic"
        actionSubtitle="Enter your PIN to securely save the recovery mnemonic"
      />
    </SectionContainer>
  );
};

RecoverAccountForm.displayName = "RecoverAccountForm";

export default RecoverAccountForm;
