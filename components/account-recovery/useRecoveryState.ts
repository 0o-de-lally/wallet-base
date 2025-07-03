import { useState, useMemo } from "react";
import { AccountAddress } from "open-libra-sdk";
import { appConfig, getProfileForAccount } from "../../util/app-config-store";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { RecoveryState, RecoveryActions, AccountMode } from "./types";

export const useRecoveryState = () => {
  // Get all available profiles
  const profileNames = Object.keys(appConfig.profiles.get());
  const activeAccountId = appConfig.activeAccountId.get();
  const activeProfileName = activeAccountId
    ? getProfileForAccount(activeAccountId)
    : null;

  // Initialize state
  const [state, setState] = useState<RecoveryState>(() => ({
    mode: "recover",
    mnemonic: "",
    nickname: "",
    error: null,
    isLoading: false,
    isVerifiedMnemonic: false,
    derivedAddress: null,
    isChainVerified: false,
    chainAddress: null,
    isVerifyingChain: false,
    isDeriving: false,
    selectedProfile: (() => {
      if (activeProfileName && profileNames.includes(activeProfileName)) {
        return activeProfileName;
      }
      return profileNames.length > 0 ? profileNames[0] : "";
    })(),
    successModalVisible: false,
    saveInitiated: false,
  }));

  // Initialize secure storage hook
  const secureStorage = useSecureStorage();

  // Actions - memoized to prevent infinite re-renders
  const actions: RecoveryActions = useMemo(
    () => ({
      setMode: (mode: AccountMode) =>
        setState((prev) => ({ ...prev, mode })),
      setMnemonic: (mnemonic: string) =>
        setState((prev) => ({ ...prev, mnemonic })),
      setNickname: (nickname: string) =>
        setState((prev) => ({ ...prev, nickname })),
      setError: (error: string | null) =>
        setState((prev) => ({ ...prev, error })),
      setIsLoading: (isLoading: boolean) =>
        setState((prev) => ({ ...prev, isLoading })),
      setIsVerifiedMnemonic: (isVerifiedMnemonic: boolean) =>
        setState((prev) => ({ ...prev, isVerifiedMnemonic })),
      setDerivedAddress: (derivedAddress: AccountAddress | null) =>
        setState((prev) => ({ ...prev, derivedAddress })),
      setIsChainVerified: (isChainVerified: boolean) =>
        setState((prev) => ({ ...prev, isChainVerified })),
      setChainAddress: (chainAddress: AccountAddress | null) =>
        setState((prev) => ({ ...prev, chainAddress })),
      setIsVerifyingChain: (isVerifyingChain: boolean) =>
        setState((prev) => ({ ...prev, isVerifyingChain })),
      setIsDeriving: (isDeriving: boolean) =>
        setState((prev) => ({ ...prev, isDeriving })),
      setSelectedProfile: (selectedProfile: string) =>
        setState((prev) => ({ ...prev, selectedProfile })),
      setSuccessModalVisible: (successModalVisible: boolean) =>
        setState((prev) => ({ ...prev, successModalVisible })),
      setSaveInitiated: (saveInitiated: boolean) =>
        setState((prev) => ({ ...prev, saveInitiated })),
    }),
    [],
  );

  return {
    state,
    actions,
    profileNames,
    hasMultipleProfiles: profileNames.length > 1,
    secureStorage,
  };
};
