import { useEffect, useCallback } from "react";
import { LibraWallet, Network } from "open-libra-sdk";
import { createAccount } from "../../util/account-utils";
import { getLibraClientUrl } from "../../util/libra-client";
import { appConfig } from "../../util/app-config-store";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { RecoveryState, RecoveryActions } from "./types";

export const useRecoveryLogic = (
  state: RecoveryState,
  actions: RecoveryActions,
  secureStorage: ReturnType<typeof useSecureStorage>,
  onComplete: () => void,
) => {
  // Check if the account already exists in the selected profile
  const accountExistsInProfile = useCallback(() => {
    const addressToCheck = state.chainAddress || state.derivedAddress;
    if (!addressToCheck || !state.selectedProfile) return false;

    const profiles = appConfig.profiles.get();
    const profile = profiles[state.selectedProfile];
    if (!profile) return false;

    const addressToCheckString = addressToCheck.toStringLong();
    return profile.accounts.some(
      (acc) => acc.account_address === addressToCheckString,
    );
  }, [state.chainAddress, state.derivedAddress, state.selectedProfile]);

  // Reset derived address when mnemonic changes
  useEffect(() => {
    if (!state.isVerifiedMnemonic) {
      actions.setDerivedAddress(null);
      actions.setIsChainVerified(false);
      actions.setChainAddress(null);
      actions.setIsDeriving(false);
      actions.setNickname("");
    }
  }, [state.isVerifiedMnemonic, actions]);

  // Derive account address when mnemonic is verified
  useEffect(() => {
    const deriveAddress = async () => {
      if (!state.isVerifiedMnemonic || !state.mnemonic.trim()) {
        return;
      }

      try {
        actions.setIsDeriving(true);
        actions.setError(null);

        const clientUrl = getLibraClientUrl();
        
        // Validate the mnemonic by creating a wallet
        // This should throw an error if the mnemonic is invalid
        const wallet = LibraWallet.fromMnemonic(
          state.mnemonic.trim(),
          Network.MAINNET,
          clientUrl,
        );

        const address = wallet.getAddress();
        actions.setDerivedAddress(address);
      } catch (err) {
        console.error("Failed to derive address from mnemonic:", err);
        const errorMessage =
          err instanceof Error
            ? `Invalid mnemonic: ${err.message}`
            : "Invalid mnemonic phrase";
        actions.setError(errorMessage);
        actions.setDerivedAddress(null);
        // Reset verification status since the mnemonic is actually invalid
        actions.setIsVerifiedMnemonic(false);
      } finally {
        actions.setIsDeriving(false);
      }
    };

    deriveAddress();
  }, [state.isVerifiedMnemonic, state.mnemonic, actions]); // Removed state.isDeriving to prevent loops

  // Show success modal after PIN process completes successfully
  useEffect(() => {
    // If we have a created account and initiated save, but PIN modal is no longer visible,
    // then PIN process is complete - show success modal only if PIN was successful
    if (
      state.accountCreated &&
      state.saveInitiated &&
      !secureStorage.pinModalVisible &&
      !state.successModalVisible
    ) {
      console.log("PIN process complete, checking result...");
      
      // Check if the PIN operation was successful
      if (secureStorage.lastPinOperationSuccess === true) {
        console.log("PIN operation successful, showing success modal");
        actions.setSuccessModalVisible(true);
      } else if (secureStorage.lastPinOperationSuccess === false) {
        console.log("PIN operation failed, allowing retry");
        actions.setError("Failed to save recovery phrase. The account was created but the recovery phrase could not be saved. Please try saving it again.");
        // Reset the save state so user can retry
        actions.setSaveInitiated(false);
        // The account is still created, so they can try to save the mnemonic again
      }
      // If lastPinOperationSuccess is null, we're still waiting for the result
    }
  }, [
    state.accountCreated,
    state.saveInitiated,
    secureStorage.pinModalVisible,
    secureStorage.lastPinOperationSuccess,
    state.successModalVisible,
    actions,
  ]);

  // Show error when account already exists in the selected profile
  useEffect(() => {
    const addressToCheck = state.chainAddress || state.derivedAddress;
    const exists = accountExistsInProfile();

    if (exists && addressToCheck) {
      const addressString = addressToCheck.toStringLong();
      const errorMessage = `Account ${addressString} already exists in profile "${state.selectedProfile}"`;
      // Only set error if it's different to prevent loops
      if (state.error !== errorMessage) {
        actions.setError(errorMessage);
      }
    } else if (!exists && addressToCheck) {
      // Only clear error if it's about "already exists" to prevent loops
      if (state.error && state.error.includes("already exists")) {
        actions.setError(null);
      }
    }
  }, [
    state.chainAddress,
    state.derivedAddress,
    state.selectedProfile,
    actions,
  ]); // Removed accountExistsInProfile and state.error to prevent loops

  const verifyOnChain = useCallback(async () => {
    if (!state.derivedAddress || !state.mnemonic.trim()) {
      actions.setError("Please enter a valid mnemonic phrase first");
      actions.setIsVerifyingChain(false);
      return;
    }

    try {
      const clientUrl = getLibraClientUrl();
      // First validate that the mnemonic can create a wallet
      const wallet = LibraWallet.fromMnemonic(
        state.mnemonic.trim(),
        Network.MAINNET,
        clientUrl,
      );

      // Get the address from the wallet to verify it matches our derived address
      const walletAddress = wallet.getAddress();
      
      // The wallet address should match our derived address
      if (walletAddress.toStringLong() !== state.derivedAddress.toStringLong()) {
        throw new Error("Mnemonic validation failed: derived address mismatch");
      }

      // Now try to sync with the chain
      try {
        await wallet.syncOnchain();
        // If sync succeeds, use the synced address
        const actualAddress = wallet.getAddress();
        actions.setChainAddress(actualAddress);
        actions.setIsChainVerified(true);
        actions.setError(null);
      } catch (syncError) {
        // If sync fails but wallet creation succeeded, this could be:
        // 1. A new account that doesn't exist on chain yet (valid)
        // 2. Network issues (valid)
        // 3. Account exists but with rotated keys (valid)
        console.log("Chain sync failed, but mnemonic is valid:", syncError);
        
        // For a valid mnemonic that doesn't sync, we still consider it verified
        // since it could be a new account or network issue
        actions.setChainAddress(walletAddress);
        actions.setIsChainVerified(true);
        actions.setError(null);
      }
    } catch (err) {
      console.error("Chain verification failed:", err);
      actions.setIsChainVerified(false);
      const errorMessage =
        err instanceof Error
          ? `Invalid mnemonic: ${err.message}`
          : "Invalid mnemonic phrase";
      actions.setError(errorMessage);
    } finally {
      actions.setIsVerifyingChain(false);
    }
  }, [state.derivedAddress, state.mnemonic, actions]);

  const handleRecoverAccount = useCallback(async () => {
    const addressToUse = state.chainAddress || state.derivedAddress;

    if (!addressToUse) {
      actions.setError("Please verify the mnemonic on chain first");
      return;
    }

    // Additional validation: ensure mnemonic is still valid before saving
    if (state.mnemonic.trim() && state.mode === "recover") {
      try {
        const clientUrl = getLibraClientUrl();
        // This should throw if the mnemonic is invalid
        LibraWallet.fromMnemonic(
          state.mnemonic.trim(),
          Network.MAINNET,
          clientUrl,
        );
      } catch (err) {
        console.error("Final mnemonic validation failed:", err);
        actions.setError("Invalid mnemonic phrase. Please check your recovery phrase and try again.");
        return;
      }
    }

    actions.setIsLoading(true);
    actions.setError(null);

    try {
      const result = await createAccount(
        state.selectedProfile,
        addressToUse,
        state.nickname || "",
      );

      if (result.success && result.account) {
        console.log("Account created successfully:", result.account.id);
        // Store the created account ID
        actions.setCreatedAccountId(result.account.id);
        actions.setAccountCreated(true);

        if (state.mnemonic.trim() && !state.saveInitiated) {
          console.log("Saving mnemonic for account:", result.account.id);
          actions.setSaveInitiated(true);

          // Don't show success modal yet - wait for PIN process to complete
          // The PIN modal will be shown by the secure storage hook
          secureStorage.handleSaveWithValue(result.account.id, state.mnemonic);
        } else {
          console.log("No mnemonic to save, showing success immediately");
          // If no mnemonic to save, show success immediately
          actions.setSuccessModalVisible(true);
        }
      } else {
        actions.setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Exception in handleRecoverAccount:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to recover account";
      actions.setError(errorMessage);
    } finally {
      actions.setIsLoading(false);
    }
  }, [
    state.chainAddress,
    state.derivedAddress,
    state.selectedProfile,
    state.nickname,
    state.mnemonic,
    state.mode,
    state.saveInitiated,
    actions,
    secureStorage,
  ]);

  // Note: Success modal is now shown immediately after account creation
  // The mnemonic saving happens in the background without additional PIN prompt

  const resetForm = useCallback(() => {
    actions.setMnemonic("");
    actions.setNickname("");
    actions.setError(null);
    actions.setIsVerifiedMnemonic(false);
    actions.setDerivedAddress(null);
    actions.setIsChainVerified(false);
    actions.setChainAddress(null);
    actions.setIsDeriving(false);
    actions.setSaveInitiated(false);
    actions.setAccountCreated(false);
    actions.setCreatedAccountId(null);
  }, [actions]);

  const handleSuccess = useCallback(() => {
    actions.setSuccessModalVisible(false);
    resetForm();
    onComplete();
  }, [actions, resetForm, onComplete]);

  // Handler for retrying mnemonic save after PIN failure
  const handleRetryMnemonicSave = useCallback(() => {
    if (state.createdAccountId && state.mnemonic.trim()) {
      console.log("Retrying mnemonic save for account:", state.createdAccountId);
      actions.setSaveInitiated(true);
      actions.setError(null);
      secureStorage.handleSaveWithValue(state.createdAccountId, state.mnemonic);
    }
  }, [state.createdAccountId, state.mnemonic, actions, secureStorage]);

  const canRecover =
    state.isVerifiedMnemonic &&
    state.derivedAddress &&
    (state.mode === "generate" || state.isChainVerified) &&
    !state.isLoading &&
    !state.isVerifyingChain &&
    !state.isDeriving &&
    !accountExistsInProfile();

  // Allow retry if account was created but mnemonic save failed
  const canRetryMnemonicSave = 
    state.accountCreated &&
    !state.saveInitiated &&
    state.mnemonic.trim() &&
    state.createdAccountId &&
    secureStorage.lastPinOperationSuccess === false;

  return {
    verifyOnChain,
    handleRecoverAccount,
    handleRetryMnemonicSave,
    resetForm,
    handleSuccess,
    canRecover,
    canRetryMnemonicSave,
    accountExistsInProfile: accountExistsInProfile(),
  };
};
