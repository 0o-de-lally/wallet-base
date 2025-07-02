import React, { memo } from "react";
import { NewAccountWizard } from "../account-creation/NewAccountWizard";

interface MnemonicGeneratorProps {
  onClear?: () => void;
}

const MnemonicGenerator = memo(({ onClear }: MnemonicGeneratorProps) => {
  return (
    <NewAccountWizard onComplete={onClear} />
  );
});

MnemonicGenerator.displayName = "MnemonicGenerator";

export default MnemonicGenerator;
