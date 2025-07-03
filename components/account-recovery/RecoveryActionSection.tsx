import React from "react";
import { ActionButton } from "../common/ActionButton";
import { FormInput } from "../common/FormInput";
import { AccountMode } from "./types";

interface RecoveryActionSectionProps {
  nickname: string;
  selectedProfile: string;
  isChainVerified: boolean;
  isLoading: boolean;
  canRecover: boolean;
  mode: AccountMode;
  onNicknameChange: (nickname: string) => void;
  onRecoverAccount: () => void;
}

export const RecoveryActionSection: React.FC<RecoveryActionSectionProps> = ({
  nickname,
  selectedProfile,
  isChainVerified,
  isLoading,
  canRecover,
  mode,
  onNicknameChange,
  onRecoverAccount,
}) => {
  const getButtonText = () => {
    if (!isChainVerified) {
      return "Verify Chain First";
    }
    return mode === "recover" ? "Recover Account" : "Create Account";
  };

  const getAccessibilityLabel = () => {
    return mode === "recover" 
      ? "Recover account from mnemonic"
      : "Create new account with generated mnemonic";
  };

  const getAccessibilityHint = () => {
    const action = mode === "recover" ? "Recovers" : "Creates";
    return `${action} an account from the mnemonic phrase and adds it to the ${selectedProfile} profile`;
  };

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
        text={getButtonText()}
        onPress={onRecoverAccount}
        disabled={!canRecover}
        isLoading={isLoading}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
      />
    </>
  );
};
