import "buffer"; // Ensure Buffer is available globally
import React, { useEffect } from "react";
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
  const { state, actions, profileNames, hasMultipleProfiles, secureStorage } = useRecoveryState();
  const { verifyOnChain, handleRecoverAccount, handleSuccess, canRecover } = useRecoveryLogic(
    state,
    actions,
    secureStorage,
    onComplete
  );

  // Update selected profile if initial profile changes
  useEffect(() => {
    if (profileName) {
      actions.setSelectedProfile(profileName);
    } else if ((!state.selectedProfile || !profileNames.includes(state.selectedProfile)) && profileNames.length > 0) {
      const activeAccountId = appConfig.activeAccountId.get();
      const activeProfileName = activeAccountId ? getProfileForAccount(activeAccountId) : null;
      
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
  const handleMnemonicValidation = (_isValid: boolean, isVerified: boolean) => {
    if (isVerified && !state.isVerifiedMnemonic) {
      actions.setIsDeriving(true);
    }
    actions.setIsVerifiedMnemonic(isVerified);
    if (!isVerified) {
      actions.setError(null);
    }
  };

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
        state={state}
        actions={actions}
        profileNames={profileNames}
        hasMultipleProfiles={hasMultipleProfiles}
      />

      <MnemonicInputSection
        state={state}
        actions={actions}
        onMnemonicValidation={handleMnemonicValidation}
      />

      <AddressVerificationSection
        state={state}
        actions={actions}
        onVerifyOnChain={verifyOnChain}
      />

      <RecoveryActionSection
        state={state}
        actions={actions}
        canRecover={canRecover || false}
        onRecoverAccount={handleRecoverAccount}
      />

      <RecoveryModals
        state={state}
        secureStorage={secureStorage}
        onSuccess={handleSuccess}
      />
    </SectionContainer>
  );
};

RecoverAccountForm.displayName = "RecoverAccountForm";

export default RecoverAccountForm;
