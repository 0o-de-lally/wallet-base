import "buffer"; // Ensure Buffer is available globally
import React, { useEffect, useCallback } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { AccountModeSelection } from "./AccountModeSelection";
import { GeneratedMnemonicSection } from "./GeneratedMnemonicSection";
import { GeneratedAddressDisplay } from "./GeneratedAddressDisplay";
import { ProfileSelectionSection } from "./ProfileSelectionSection";
import { MnemonicInputSection } from "./MnemonicInputSection";
import { AddressVerificationSection } from "./AddressVerificationSection";
import { RecoveryActionSection } from "./RecoveryActionSection";
import { RecoveryModals } from "./RecoveryModals";
import { useRecoveryState } from "./useRecoveryState";
import { useRecoveryLogic } from "./useRecoveryLogic";
import { RecoverAccountFormProps, AccountMode } from "./types";

const RecoverAccountForm: React.FC<RecoverAccountFormProps> = ({
  profileName,
  onComplete,
}) => {
  const { state, actions, profileNames, hasMultipleProfiles, secureStorage } =
    useRecoveryState();
  const { 
    verifyOnChain, 
    handleRecoverAccount, 
    handleRetryMnemonicSave,
    handleSuccess, 
    canRecover,
    canRetryMnemonicSave,
  } = useRecoveryLogic(state, actions, secureStorage, onComplete);

  // Update selected profile if initial profile changes
  useEffect(() => {
    if (profileName && state.selectedProfile !== profileName) {
      actions.setSelectedProfile(profileName);
    }
  }, [profileName, state.selectedProfile, actions]);

  // Set default profile if none selected
  useEffect(() => {
    if (
      (!state.selectedProfile ||
        !profileNames.includes(state.selectedProfile)) &&
      profileNames.length > 0
    ) {
      actions.setSelectedProfile(profileNames[0]);
    }
  }, [profileNames, state.selectedProfile, actions]);

  // Mnemonic validation handler
  const handleMnemonicValidation = useCallback(
    (_isValid: boolean, isVerified: boolean) => {
      if (isVerified && !state.isVerifiedMnemonic) {
        actions.setIsDeriving(true);
      }
      actions.setIsVerifiedMnemonic(isVerified);
      if (!isVerified) {
        actions.setError(null);
      }
    },
    [state.isVerifiedMnemonic, actions],
  );

  // Profile selection handler
  const handleProfileSelect = useCallback(
    (profile: string) => {
      actions.setSelectedProfile(profile);
      actions.setError(null);
    },
    [actions],
  );

  // Verify on chain handler
  const handleVerifyOnChain = useCallback(() => {
    actions.setIsVerifyingChain(true);
    actions.setError(null);
    verifyOnChain();
  }, [actions, verifyOnChain]);

  // Mode change handler
  const handleModeChange = useCallback(
    (mode: AccountMode) => {
      actions.setMode(mode);
      actions.setMnemonic("");
      actions.setError(null);
      actions.setIsVerifiedMnemonic(false);
      actions.setDerivedAddress(null);
      actions.setChainAddress(null);
      actions.setAccountCreated(false);
      actions.setCreatedAccountId(null);
      actions.setSaveInitiated(false);
      // For generate mode, we don't need chain verification
      actions.setIsChainVerified(mode === "generate");
    },
    [actions],
  );

  // Generated mnemonic handler
  const handleMnemonicGenerated = useCallback(
    (mnemonic: string) => {
      actions.setMnemonic(mnemonic);
      actions.setIsVerifiedMnemonic(true);
      actions.setIsDeriving(true);
    },
    [actions],
  );

  return (
    <SectionContainer>
      <AccountModeSelection
        selectedMode={state.mode}
        onModeChange={handleModeChange}
      />

      {!hasMultipleProfiles && state.error && (
        <Text style={styles.errorText}>{state.error}</Text>
      )}

      <ProfileSelectionSection
        error={hasMultipleProfiles ? state.error : null}
        selectedProfile={state.selectedProfile}
        profileNames={profileNames}
        hasMultipleProfiles={hasMultipleProfiles}
        onProfileSelect={handleProfileSelect}
      />

      {state.mode === "recover" ? (
        <MnemonicInputSection
          mnemonic={state.mnemonic}
          isDeriving={state.isDeriving}
          isLoading={state.isLoading}
          onMnemonicChange={actions.setMnemonic}
          onMnemonicValidation={handleMnemonicValidation}
        />
      ) : (
        <GeneratedMnemonicSection
          onMnemonicGenerated={handleMnemonicGenerated}
          isLoading={state.isLoading}
        />
      )}

      {state.mode === "generate" && (
        <GeneratedAddressDisplay
          derivedAddress={state.derivedAddress}
          isDeriving={state.isDeriving}
        />
      )}

      {state.mode === "recover" && (
        <AddressVerificationSection
          derivedAddress={state.derivedAddress}
          chainAddress={state.chainAddress}
          isChainVerified={state.isChainVerified}
          isVerifyingChain={state.isVerifyingChain}
          onVerifyOnChain={handleVerifyOnChain}
        />
      )}

      <RecoveryActionSection
        nickname={state.nickname}
        selectedProfile={state.selectedProfile}
        isChainVerified={state.isChainVerified}
        isLoading={state.isLoading}
        canRecover={canRecover || false}
        canRetryMnemonicSave={canRetryMnemonicSave || false}
        mode={state.mode}
        onNicknameChange={actions.setNickname}
        onRecoverAccount={handleRecoverAccount}
        onRetryMnemonicSave={handleRetryMnemonicSave}
      />

      <RecoveryModals
        successModalVisible={state.successModalVisible}
        selectedProfile={state.selectedProfile}
        mode={state.mode}
        secureStorage={secureStorage}
        onSuccess={handleSuccess}
      />
    </SectionContainer>
  );
};

RecoverAccountForm.displayName = "RecoverAccountForm";

export default RecoverAccountForm;
