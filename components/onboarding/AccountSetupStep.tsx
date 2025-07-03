import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../styles/styles";
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
        <TouchableOpacity
          onPress={onBackToChoice}
          style={{
            padding: 8,
            borderRadius: 4,
          }}
          accessibilityLabel="Go back to account choice"
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
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
