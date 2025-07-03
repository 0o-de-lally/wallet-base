import React from "react";
import { ActionButton } from "../common/ActionButton";
import { FormInput } from "../common/FormInput";

interface RecoveryActionSectionProps {
  nickname: string;
  selectedProfile: string;
  isChainVerified: boolean;
  isLoading: boolean;
  canRecover: boolean;
  onNicknameChange: (nickname: string) => void;
  onRecoverAccount: () => void;
}

export const RecoveryActionSection: React.FC<RecoveryActionSectionProps> = ({
  nickname,
  selectedProfile,
  isChainVerified,
  isLoading,
  canRecover,
  onNicknameChange,
  onRecoverAccount,
}) => {
  return (
    <>
      <FormInput
        label="Nickname (optional):"
        value={nickname}
        onChangeText={onNicknameChange}
        placeholder="Enter a friendly name"
        disabled={isLoading}
      />

      <ActionButton
        text={isChainVerified ? "Recover Account" : "Verify Chain First"}
        onPress={onRecoverAccount}
        disabled={!canRecover}
        isLoading={isLoading}
        accessibilityLabel="Recover account from mnemonic"
        accessibilityHint={`Recovers an account from the mnemonic phrase and adds it to the ${selectedProfile} profile`}
      />
    </>
  );
};
