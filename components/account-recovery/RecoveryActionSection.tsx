import React from "react";
import { ActionButton } from "../common/ActionButton";
import { FormInput } from "../common/FormInput";
import { RecoveryState, RecoveryActions } from "./types";

interface RecoveryActionSectionProps {
  state: RecoveryState;
  actions: RecoveryActions;
  canRecover: boolean;
  onRecoverAccount: () => void;
}

export const RecoveryActionSection: React.FC<RecoveryActionSectionProps> = ({
  state,
  actions,
  canRecover,
  onRecoverAccount,
}) => {
  return (
    <>
      <FormInput
        label="Nickname (optional):"
        value={state.nickname}
        onChangeText={actions.setNickname}
        placeholder="Enter a friendly name"
        disabled={state.isLoading}
      />

      <ActionButton
        text={state.isChainVerified ? "Recover Account" : "Verify Chain First"}
        onPress={onRecoverAccount}
        disabled={!canRecover}
        isLoading={state.isLoading}
        accessibilityLabel="Recover account from mnemonic"
        accessibilityHint={`Recovers an account from the mnemonic phrase and adds it to the ${state.selectedProfile} profile`}
      />
    </>
  );
};
