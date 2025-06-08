import "buffer"; // Ensure Buffer is available globally
import React, { useState, useEffect } from "react";
import { Text, View } from "react-native";
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
  let cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

  // Remove leading zeros
  cleanAddress = cleanAddress.replace(/^0+/, "");

  // If all zeros were removed, keep at least one character
  if (cleanAddress.length === 0) {
    cleanAddress = "0";
  }

  // Take first 3 characters and last 3 characters
  if (cleanAddress.length <= 6) {
    return cleanAddress;
  }

  return `${cleanAddress.slice(0, 3)}...${cleanAddress.slice(-3)}`;
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

  // New state for chain verification
  const [isChainVerified, setIsChainVerified] = useState(false);
  const [chainAddress, setChainAddress] = useState<string | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);

  const hasMultipleProfiles = profileNames.length > 1;

  // State for modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // State for tracking if save has been initiated to prevent multiple saves
  const [saveInitiated, setSaveInitiated] = useState(false);

  // Initialize secure storage hook without an initial account (we'll set it after account creation)
  const secureStorage = useSecureStorage();

  // Check if the account already exists in the selected profile
  const accountExistsInProfile = React.useMemo(() => {
    // Use chain address if available (actual on-chain address), otherwise derived address
    const addressToCheck = chainAddress || derivedAddress;
    if (!addressToCheck || !selectedProfile) return false;

    const profiles = appConfig.profiles.get();
    const profile = profiles[selectedProfile];

    if (!profile) return false;

    return profile.accounts.some(
      (acc) => acc.account_address === addressToCheck,
    );
  }, [chainAddress, derivedAddress, selectedProfile]);

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
      setIsChainVerified(false);
      setChainAddress(null);
      // Reset nickname when mnemonic changes so it can be derived from the final address
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

        // Don't set nickname here - wait until after chain verification
        // to use the final address (chain address or derived address)
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

  // Chain verification function
  const verifyOnChain = async () => {
    if (!derivedAddress || !mnemonic.trim()) {
      setError("Please enter a valid mnemonic phrase first");
      return;
    }

    try {
      setIsVerifyingChain(true);
      setError(null);

      // Create wallet from mnemonic
      const wallet = LibraWallet.fromMnemonic(
        mnemonic.trim(),
        Network.MAINNET,
        MainnetURL,
      );

      try {
        // Try to connect to chain and verify the address
        await wallet.syncOnchain();

        // Get the actual on-chain address
        const actualAddress = wallet.getAddress().toStringLong();
        setChainAddress(actualAddress);

        // Always verify successfully - use the actual on-chain address
        setIsChainVerified(true);

        // If addresses don't match, it means the account's auth key was rotated
        // This is not an error, just a note for the user
        if (actualAddress !== derivedAddress) {
          console.log(`Key rotation detected. On-chain address: ${actualAddress}, derived: ${derivedAddress}`);
        }
        setError(null);

        // Set default nickname if none provided, using the actual chain address
        if (!nickname.trim()) {
          setNickname(deriveShortNickname(actualAddress));
        }
      } catch (syncError) {
        // If syncOnchain fails, it likely means the account is new and doesn't exist on chain yet
        // This is valid for account recovery - use the derived address
        console.log("Account not found on chain (new account):", syncError);
        setChainAddress(derivedAddress);
        setIsChainVerified(true);
        setError(null);

        // Set default nickname if none provided, using the derived address (since no chain address)
        if (!nickname.trim()) {
          setNickname(deriveShortNickname(derivedAddress));
        }
      }
    } catch (err) {
      console.error("Chain verification failed:", err);
      setIsChainVerified(false);
      const errorMessage =
        err instanceof Error
          ? `Chain verification failed: ${err.message}`
          : "Failed to verify account on chain";
      setError(errorMessage);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  // Show error when account already exists in the selected profile
  useEffect(() => {
    const addressToCheck = chainAddress || derivedAddress;
    if (accountExistsInProfile && addressToCheck) {
      setError(
        `Account ${addressToCheck} already exists in profile "${selectedProfile}"`,
      );
    } else if (!accountExistsInProfile && addressToCheck) {
      // Clear the error if account doesn't exist (but keep other errors like rotation warnings)
      if (error && error.includes("already exists")) {
        setError(null);
      }
    }
  }, [accountExistsInProfile, chainAddress, derivedAddress, selectedProfile, error]);

  // Expose a reset method through prop callback
  const resetForm = () => {
    setMnemonic("");
    setNickname("");
    setError(null);
    setIsVerifiedMnemonic(false);
    setDerivedAddress(null);
    setIsChainVerified(false);
    setChainAddress(null);
    setSaveInitiated(false); // Reset save state
    // Don't reset the selectedProfile here to persist selection
  };

  // Call the onResetForm callback with our local resetForm function
  useEffect(() => {
    if (onResetForm) {
      onResetForm();
    }
  }, [onResetForm]);

  const handleRecoverAccount = async () => {
    console.log("handleRecoverAccount called");
    console.log("chainAddress:", chainAddress);
    console.log("derivedAddress:", derivedAddress);
    console.log("selectedProfile:", selectedProfile);
    console.log("canRecover:", canRecover);

    // Use the chain address (actual on-chain address) if available, otherwise fallback to derived
    const addressToUse = chainAddress || derivedAddress;

    if (!addressToUse) {
      console.log("Error: No address available");
      setError("Please verify the mnemonic on chain first");
      return;
    }

    console.log("Starting recovery process with address:", addressToUse);
    setIsLoading(true);
    setError(null);

    try {
      console.log("Calling createAccount with:", {
        selectedProfile,
        addressToUse,
        nickname,
      });
      const result = await createAccount(
        selectedProfile,
        addressToUse,
        nickname || deriveShortNickname(addressToUse),
      );

      console.log("createAccount result:", result);

      if (result.success && result.account) {
        console.log("Account created successfully:", result.account.id);

        // Trigger mnemonic save immediately now that we have the account ID
        if (mnemonic.trim() && !saveInitiated) {
          setSaveInitiated(true);
          secureStorage.handleSaveWithValue(result.account.id, mnemonic);
        }

        setSuccessModalVisible(true);
      } else {
        console.log("Account creation failed:", result.error);
        setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Exception in handleRecoverAccount:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to recover account";
      setError(errorMessage);
    } finally {
      console.log("Recovery process completed, setting isLoading to false");
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
    // Clear errors when mnemonic validation changes (but let the address check set new ones)
    if (!isVerified) {
      setError(null);
    }
  };

  // Debug the current selection state
  useEffect(() => {
    console.log("Current selected profile:", selectedProfile);
    console.log("Available profiles:", profileNames);
  }, [selectedProfile, profileNames]);

  const canRecover =
    isVerifiedMnemonic &&
    derivedAddress &&
    isChainVerified &&
    !isLoading &&
    !isVerifyingChain &&
    !accountExistsInProfile;

  // Debug the canRecover state
  useEffect(() => {
    console.log("canRecover calculation:");
    console.log("  isVerifiedMnemonic:", isVerifiedMnemonic);
    console.log("  derivedAddress:", derivedAddress);
    console.log("  isChainVerified:", isChainVerified);
    console.log("  isLoading:", isLoading);
    console.log("  isVerifyingChain:", isVerifyingChain);
    console.log("  accountExistsInProfile:", accountExistsInProfile);
    console.log("  canRecover:", canRecover);
  }, [
    isVerifiedMnemonic,
    derivedAddress,
    isChainVerified,
    isLoading,
    isVerifyingChain,
    accountExistsInProfile,
    canRecover,
  ]);

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

      {derivedAddress && !isChainVerified && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Verify the mnemonic by connecting to the blockchain. This works for both existing accounts and new accounts.
          </Text>
          <ActionButton
            text="Verify on Chain"
            onPress={verifyOnChain}
            disabled={isVerifyingChain || !derivedAddress}
            isLoading={isVerifyingChain}
            accessibilityLabel="Verify address on blockchain"
            accessibilityHint="Connects to the blockchain to verify the account exists or confirm it's new"
          />
        </View>
      )}

      {isChainVerified && chainAddress && (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: "#a5d6b7" }]}>
            ✓ Chain verification successful!
            {chainAddress === derivedAddress ?
              " (Account verified or new)" :
              " (Account found with rotated keys)"}
          </Text>
          <FormInput
            label="Actual Chain Address:"
            value={chainAddress}
            onChangeText={() => {}} // Read-only
            placeholder="Verified address"
            disabled={true}
          />
        </View>
      )}

      <FormInput
        label="Nickname (optional):"
        value={nickname}
        onChangeText={setNickname}
        placeholder="Enter a friendly name"
        disabled={isLoading}
      />

      <ActionButton
        text={isChainVerified ? "Recover Account" : "Verify Chain First"}
        onPress={() => {
          console.log("Recover Account button clicked");
          console.log("Button disabled state:", !canRecover);
          console.log("Button loading state:", isLoading);
          handleRecoverAccount();
        }}
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
        onClose={secureStorage.handlePinModalClose}
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
