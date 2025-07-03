import "buffer"; // Ensure Buffer is available globally
import React, { useEffect, useCallback } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { appConfig, getProfileForAccount } from "../../util/app-config-store";
import { ProfileSelectionSection } from "./ProfileSelectionSection";
import { MnemonicInputSection } from "./MnemonicInputSection";
import { AddressVerificationSection } from "./AddressVerificationSection";
import { RecoveryActionSection } from "./RecoveryActionSection";
import { RecoveryModals } from "./RecoveryModals";
import { useRecoveryState } from "./useRecoveryState";
import { useRecoveryLogic } from "./useRecoveryLogic";
import { RecoverAccountFormProps } from "./types";

const RecoverAccountForm: React.FC<RecoverAccountFormProps> = ({
  profileName,
  onComplete,
  onResetForm,
}) => {
  const { state, actions, profileNames, hasMultipleProfiles, secureStorage } =
    useRecoveryState();
  const { verifyOnChain, handleRecoverAccount, handleSuccess, canRecover } =
    useRecoveryLogic(state, actions, secureStorage, onComplete);

  // Update selected profile if initial profile changes
  useEffect(() => {
    if (profileName) {
      actions.setSelectedProfile(profileName);
    } else if (
      (!state.selectedProfile ||
        !profileNames.includes(state.selectedProfile)) &&
      profileNames.length > 0
    ) {
      const activeAccountId = appConfig.activeAccountId.get();
      const activeProfileName = activeAccountId
        ? getProfileForAccount(activeAccountId)
        : null;

      if (activeProfileName && profileNames.includes(activeProfileName)) {
        actions.setSelectedProfile(activeProfileName);
      } else {
        actions.setSelectedProfile(profileNames[0]);
      }
    }
  }, [profileName, profileNames, state.selectedProfile, actions]);

  // Call the onResetForm callback with our local resetForm function
  useEffect(() => {
    if (onResetForm) {
      onResetForm();
    }
  }, [onResetForm]);

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

  return (
    <SectionContainer
      title={
        profileName ? `Recover Account to ${profileName}` : "Recover Account"
      }
    >
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

      <MnemonicInputSection
        mnemonic={state.mnemonic}
        isDeriving={state.isDeriving}
        isLoading={state.isLoading}
        onMnemonicChange={actions.setMnemonic}
        onMnemonicValidation={handleMnemonicValidation}
      />

      <AddressVerificationSection
        derivedAddress={state.derivedAddress}
        chainAddress={state.chainAddress}
        isChainVerified={state.isChainVerified}
        isVerifyingChain={state.isVerifyingChain}
        onVerifyOnChain={handleVerifyOnChain}
      />

      <RecoveryActionSection
        nickname={state.nickname}
        selectedProfile={state.selectedProfile}
        isChainVerified={state.isChainVerified}
        isLoading={state.isLoading}
        canRecover={canRecover || false}
        onNicknameChange={actions.setNickname}
        onRecoverAccount={handleRecoverAccount}
      />

      <RecoveryModals
        successModalVisible={state.successModalVisible}
        selectedProfile={state.selectedProfile}
        secureStorage={secureStorage}
        onSuccess={handleSuccess}
      />
    </SectionContainer>
  );
};

RecoverAccountForm.displayName = "RecoverAccountForm";

export default RecoverAccountForm;
