import React from "react";
import { View } from "react-native";
import { ActionButton } from "../common/ActionButton";
import AddAccountForm from "../profile/AddAccountForm";
import RecoverAccountForm from "../account-recovery/RecoverAccountForm";

interface AccountSetupStepProps {
  accountChoice: "create" | "recover" | null;
  onBackToChoice: () => void;
  onComplete: () => void;
}

export const AccountSetupStep: React.FC<AccountSetupStepProps> = ({
  accountChoice,
  onBackToChoice,
  onComplete,
}) => {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <ActionButton
          text="← Back"
          onPress={onBackToChoice}
          size="small"
          accessibilityLabel="Go back to account choice"
        />
      </View>

      {accountChoice === "create" && (
        <AddAccountForm
          profileName="mainnet" // Use the default profile
          onComplete={onComplete}
        />
      )}

      {accountChoice === "recover" && (
        <RecoverAccountForm
          profileName="mainnet" // Use the default profile
          onComplete={onComplete}
        />
      )}
    </View>
  );
};
