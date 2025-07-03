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
  onComplete: () => void
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
      (acc) => acc.account_address === addressToCheckString
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
        if (!state.isDeriving) {
          actions.setIsDeriving(true);
        }
        actions.setError(null);

        const clientUrl = getLibraClientUrl();
        const wallet = LibraWallet.fromMnemonic(
          state.mnemonic.trim(),
          Network.MAINNET,
          clientUrl
        );

        const address = wallet.getAddress();
        actions.setDerivedAddress(address);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to derive address from mnemonic";
        actions.setError(errorMessage);
        actions.setDerivedAddress(null);
      } finally {
        actions.setIsDeriving(false);
      }
    };

    deriveAddress();
  }, [state.isVerifiedMnemonic, state.mnemonic, state.isDeriving, actions]);

  // Show error when account already exists in the selected profile
  useEffect(() => {
    const addressToCheck = state.chainAddress || state.derivedAddress;
    const exists = accountExistsInProfile();

    if (exists && addressToCheck) {
      const addressString = addressToCheck.toStringLong();
      actions.setError(
        `Account ${addressString} already exists in profile "${state.selectedProfile}"`
      );
    } else if (!exists && addressToCheck) {
      if (state.error && state.error.includes("already exists")) {
        actions.setError(null);
      }
    }
  }, [accountExistsInProfile, state.chainAddress, state.derivedAddress, state.selectedProfile, state.error, actions]);

  const verifyOnChain = useCallback(async () => {
    if (!state.derivedAddress || !state.mnemonic.trim()) {
      actions.setError("Please enter a valid mnemonic phrase first");
      actions.setIsVerifyingChain(false);
      return;
    }

    try {
      const clientUrl = getLibraClientUrl();
      const wallet = LibraWallet.fromMnemonic(
        state.mnemonic.trim(),
        Network.MAINNET,
        clientUrl
      );

      try {
        await wallet.syncOnchain();
        const actualAddress = wallet.getAddress();
        actions.setChainAddress(actualAddress);
        actions.setIsChainVerified(true);
        actions.setError(null);
      } catch {
        actions.setChainAddress(state.derivedAddress);
        actions.setIsChainVerified(true);
        actions.setError(null);
      }
    } catch (err) {
      console.error("Chain verification failed:", err);
      actions.setIsChainVerified(false);
      const errorMessage =
        err instanceof Error
          ? `Chain verification failed: ${err.message}`
          : "Failed to verify account on chain";
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

    actions.setIsLoading(true);
    actions.setError(null);

    try {
      const result = await createAccount(
        state.selectedProfile,
        addressToUse,
        state.nickname || ""
      );

      if (result.success && result.account) {
        if (state.mnemonic.trim() && !state.saveInitiated) {
          actions.setSaveInitiated(true);
          secureStorage.handleSaveWithValue(result.account.id, state.mnemonic);
        }
        actions.setSuccessModalVisible(true);
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
  }, [state.chainAddress, state.derivedAddress, state.selectedProfile, state.nickname, state.mnemonic, state.saveInitiated, secureStorage, actions]);

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
  }, [actions]);

  const handleSuccess = useCallback(() => {
    actions.setSuccessModalVisible(false);
    resetForm();
    onComplete();
  }, [actions, resetForm, onComplete]);

  const canRecover =
    state.isVerifiedMnemonic &&
    state.derivedAddress &&
    state.isChainVerified &&
    !state.isLoading &&
    !state.isVerifyingChain &&
    !state.isDeriving &&
    !accountExistsInProfile();

  return {
    verifyOnChain,
    handleRecoverAccount,
    resetForm,
    handleSuccess,
    canRecover,
    accountExistsInProfile: accountExistsInProfile(),
  };
};
