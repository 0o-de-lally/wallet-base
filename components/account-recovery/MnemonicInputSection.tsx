import React from "react";
import { MnemonicInput } from "../common/MnemonicInput";
import { ProgressIndicator } from "../common/ProgressIndicator";

interface MnemonicInputSectionProps {
  mnemonic: string;
  isDeriving: boolean;
  isLoading: boolean;
  onMnemonicChange: (mnemonic: string) => void;
  onMnemonicValidation: (isValid: boolean, isVerified: boolean) => void;
}

export const MnemonicInputSection: React.FC<MnemonicInputSectionProps> = ({
  mnemonic,
  isDeriving,
  isLoading,
  onMnemonicChange,
  onMnemonicValidation,
}) => {
  return (
    <>
      <MnemonicInput
        label="Recovery Phrase"
        value={mnemonic}
        onChangeText={onMnemonicChange}
        onValidationChange={onMnemonicValidation}
        placeholder="Enter your 24-word recovery phrase..."
        disabled={isLoading || isDeriving}
        showWordCount={true}
        autoValidate={true}
      />

      {isDeriving && (
        <ProgressIndicator
          text="Deriving keys from mnemonic..."
          accessibilityLabel="Deriving account keys"
          accessibilityHint="Processing the mnemonic phrase to derive account keys"
        />
      )}
    </>
  );
};
