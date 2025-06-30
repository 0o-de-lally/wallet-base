import "buffer"; // Ensure Buffer is available globally
import React, { useState, useEffect } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
import { getProfileForAccount } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { MnemonicInput } from "../common/MnemonicInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { appConfig } from "../../util/app-config-store";
import Dropdown from "../common/Dropdown";
import { createAccount } from "../../util/account-utils";
import { AccountAddress, LibraWallet, Network } from "open-libra-sdk";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import { getLibraClientUrl } from "../../util/libra-client";

interface RecoverAccountFormProps {
  profileName?: string;
  onComplete: () => void;
  onResetForm?: () => void;
}

const RecoverAccountForm: React.FC<RecoverAccountFormProps> = ({
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
  const [derivedAddress, setDerivedAddress] = useState<AccountAddress | null>(
    null,
  );

  // New state for chain verification
  const [isChainVerified, setIsChainVerified] = useState(false);
  const [chainAddress, setChainAddress] = useState<AccountAddress | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);

  // Add state for wallet derivation
  const [isDeriving, setIsDeriving] = useState(false);

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

    const addressToCheckString = addressToCheck.toStringLong();
    return profile.accounts.some(
      (acc) => acc.account_address === addressToCheckString,
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
      setIsDeriving(false);
      // Reset nickname when mnemonic changes
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
        // Only set deriving state if not already set (from validation handler)
        if (!isDeriving) {
          setIsDeriving(true);
        }
        setError(null);

        // Create wallet from mnemonic using the same URL configuration as the passed client
        // Note: LibraWallet.fromMnemonic creates its own client connection, so we use
        // getLibraClientUrl() to ensure consistency with the global client configuration
        const clientUrl = getLibraClientUrl();
        const wallet = LibraWallet.fromMnemonic(
          mnemonic.trim(),
          Network.MAINNET,
          clientUrl, // Use the same URL as the passed client
        );

        // Get the account address
        const address = wallet.getAddress();
        setDerivedAddress(address);

        // Don't set nickname automatically - let user provide their own
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to derive address from mnemonic";
        setError(errorMessage);
        setDerivedAddress(null);
      } finally {
        setIsDeriving(false);
      }
    };

    deriveAddress();
  }, [isVerifiedMnemonic, mnemonic, isDeriving]);

  // Chain verification function
  const verifyOnChain = async () => {
    if (!derivedAddress || !mnemonic.trim()) {
      setError("Please enter a valid mnemonic phrase first");
      setIsVerifyingChain(false);
      return;
    }

    try {
      // Create wallet from mnemonic using the same URL configuration as the passed client
      // Note: LibraWallet.fromMnemonic creates its own client connection, so we use
      // getLibraClientUrl() to ensure consistency with the global client configuration
      const clientUrl = getLibraClientUrl();
      const wallet = LibraWallet.fromMnemonic(
        mnemonic.trim(),
        Network.MAINNET,
        clientUrl, // Use the same URL as the passed client
      );

      try {
        // Try to connect to chain and verify the address
        await wallet.syncOnchain();

        // Get the actual on-chain address
        const actualAddress = wallet.getAddress();
        setChainAddress(actualAddress);

        // Always verify successfully - use the actual on-chain address
        setIsChainVerified(true);

        // If addresses don't match, it means the account's auth key was rotated
        // This is not an error, just a note for the user
        const actualAddressString = actualAddress.toStringLong();
        const derivedAddressString = derivedAddress!.toStringLong();
        if (actualAddressString !== derivedAddressString) {
          // console.log(
          //   `Key rotation detected. On-chain address: ${actualAddressString}, derived: ${derivedAddressString}`,
          // );
        }
        setError(null);

        // Don't set default nickname - let user provide their own
      } catch {
        // If syncOnchain fails, it likely means the account is new and doesn't exist on chain yet
        // This is valid for account recovery - use the derived address
        // console.log("Account not found on chain (new account):", syncError);
        setChainAddress(derivedAddress);
        setIsChainVerified(true);
        setError(null);

        // Don't set default nickname - let user provide their own
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
      const addressString = addressToCheck.toStringLong();
      setError(
        `Account ${addressString} already exists in profile "${selectedProfile}"`,
      );
    } else if (!accountExistsInProfile && addressToCheck) {
      // Clear the error if account doesn't exist (but keep other errors like rotation warnings)
      if (error && error.includes("already exists")) {
        setError(null);
      }
    }
  }, [
    accountExistsInProfile,
    chainAddress,
    derivedAddress,
    selectedProfile,
    error,
  ]);

  // Expose a reset method through prop callback
  const resetForm = () => {
    setMnemonic("");
    setNickname("");
    setError(null);
    setIsVerifiedMnemonic(false);
    setDerivedAddress(null);
    setIsChainVerified(false);
    setChainAddress(null);
    setIsDeriving(false);
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
    // console.log("handleRecoverAccount called");
    // console.log("chainAddress:", chainAddress?.toStringLong());
    // console.log("derivedAddress:", derivedAddress?.toStringLong());
    // console.log("selectedProfile:", selectedProfile);
    // console.log("canRecover:", canRecover);

    // Use the chain address (actual on-chain address) if available, otherwise fallback to derived
    const addressToUse = chainAddress || derivedAddress;

    if (!addressToUse) {
      // console.log("Error: No address available");
      setError("Please verify the mnemonic on chain first");
      return;
    }

    // console.log(
    //   "Starting recovery process with address:",
    //   addressToUse.toStringLong(),
    // );
    setIsLoading(true);
    setError(null);

    try {
      // console.log("Calling createAccount with:", {
      //   selectedProfile,
      //   addressToUse: addressToUse.toStringLong(),
      //   nickname,
      // });
      const result = await createAccount(
        selectedProfile,
        addressToUse,
        nickname || "", // Don't auto-generate nickname, let user provide their own
      );

      // console.log("createAccount result:", result);

      if (result.success && result.account) {
        // console.log("Account created successfully:", result.account.id);

        // Trigger mnemonic save immediately now that we have the account ID
        if (mnemonic.trim() && !saveInitiated) {
          setSaveInitiated(true);
          secureStorage.handleSaveWithValue(result.account.id, mnemonic);
        }

        setSuccessModalVisible(true);
      } else {
        // console.log("Account creation failed:", result.error);
        setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Exception in handleRecoverAccount:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to recover account";
      setError(errorMessage);
    } finally {
      // console.log("Recovery process completed, setting isLoading to false");
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
    // console.log("Profile selected in handler:", profile);
    setSelectedProfile(profile);
    setError(null); // Clear errors on profile change
  };

  // Mnemonic validation handler
  const handleMnemonicValidation = (isValid: boolean, isVerified: boolean) => {
    // If mnemonic becomes verified, immediately show loading state
    if (isVerified && !isVerifiedMnemonic) {
      setIsDeriving(true);
    }

    setIsVerifiedMnemonic(isVerified);
    // Clear errors when mnemonic validation changes (but let the address check set new ones)
    if (!isVerified) {
      setError(null);
    }
  };

  // Debug the current selection state
  // useEffect(() => {
  //   console.log("Current selected profile:", selectedProfile);
  //   console.log("Available profiles:", profileNames);
  // }, [selectedProfile, profileNames]);

  const canRecover =
    isVerifiedMnemonic &&
    derivedAddress &&
    isChainVerified &&
    !isLoading &&
    !isVerifyingChain &&
    !isDeriving &&
    !accountExistsInProfile;

  // Debug the canRecover state
  // useEffect(() => {
  //   console.log("canRecover calculation:");
  //   console.log("  isVerifiedMnemonic:", isVerifiedMnemonic);
  //   console.log("  derivedAddress:", derivedAddress);
  //   console.log("  isChainVerified:", isChainVerified);
  //   console.log("  isLoading:", isLoading);
  //   console.log("  isVerifyingChain:", isVerifyingChain);
  //   console.log("  isDeriving:", isDeriving);
  //   console.log("  accountExistsInProfile:", accountExistsInProfile);
  //   console.log("  canRecover:", canRecover);
  // }, [
  //   isVerifiedMnemonic,
  //   derivedAddress,
  //   isChainVerified,
  //   isLoading,
  //   isVerifyingChain,
  //   isDeriving,
  //   accountExistsInProfile,
  //   canRecover,
  // ]);

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
        disabled={isLoading || isDeriving}
        showWordCount={true}
        autoValidate={true}
      />

      {isDeriving && (
        <View style={styles.inputContainer}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 8,
            }}
          >
            <ActivityIndicator size="small" />
            <Text style={[styles.label]}>Deriving keys from mnemonic...</Text>
          </View>
        </View>
      )}

      {derivedAddress && (
        <FormInput
          label="Derived Address:"
          value={derivedAddress.toStringLong()}
          onChangeText={() => {}} // Read-only
          placeholder="Address will appear here"
          disabled={true}
        />
      )}

      {derivedAddress && !isChainVerified && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Verify the mnemonic by connecting to the blockchain. This works for
            both existing accounts and new accounts.
          </Text>
          <ActionButton
            text="Verify on Chain"
            onPress={() => {
              // Set loading state immediately in the onClick handler
              setIsVerifyingChain(true);
              setError(null);
              // Then call the async function
              verifyOnChain();
            }}
            disabled={isVerifyingChain || !derivedAddress}
            isLoading={isVerifyingChain}
            accessibilityLabel="Verify address on blockchain"
            accessibilityHint="Connects to the blockchain to verify the account exists or confirm it's new"
          />
        </View>
      )}

      {isChainVerified && chainAddress && (
        <View style={styles.inputContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={colors.green} 
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.label, { color: colors.green }]}>
              Chain verification successful!
              {chainAddress?.toStringLong() === derivedAddress?.toStringLong()
                ? " (Account verified or new)"
                : " (Account found with rotated keys)"}
            </Text>
          </View>
          <FormInput
            label="Actual Chain Address:"
            value={chainAddress.toStringLong()}
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
          // console.log("Recover Account button clicked");
          // console.log("Button disabled state:", !canRecover);
          // console.log("Button loading state:", isLoading);
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
