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
  canRetryMnemonicSave?: boolean;
  mode: AccountMode;
  onNicknameChange: (nickname: string) => void;
  onRecoverAccount: () => void;
  onRetryMnemonicSave?: () => void;
}

export const RecoveryActionSection: React.FC<RecoveryActionSectionProps> = ({
  nickname,
  selectedProfile,
  isChainVerified,
  isLoading,
  canRecover,
  canRetryMnemonicSave = false,
  mode,
  onNicknameChange,
  onRecoverAccount,
  onRetryMnemonicSave,
}) => {
  const getButtonText = () => {
    if (mode === "recover" && !isChainVerified) {
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
        style={{ width: "100%", marginHorizontal: 0 }}
      />

      {canRetryMnemonicSave && onRetryMnemonicSave && (
        <ActionButton
          text="Retry Saving Recovery Phrase"
          onPress={onRetryMnemonicSave}
          disabled={isLoading}
          isLoading={isLoading}
          accessibilityLabel="Retry saving recovery phrase"
          accessibilityHint="Attempt to save the recovery phrase again after PIN failure"
          style={{ width: "100%", marginHorizontal: 0, marginTop: 12 }}
          variant="secondary"
        />
      )}
    </>
  );
};
