import React from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface CompleteStepProps {
  onFinish: () => void;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({ onFinish }) => {
  return (
    <SectionContainer title="Setup Complete!">
      <Text style={styles.resultValue}>
        🎉 Congratulations! Your wallet is now set up and ready to use.
      </Text>
      <Text style={[styles.resultValue, { marginTop: 10 }]}>
        You can now:
      </Text>
      <Text style={styles.resultValue}>
        • View and manage your accounts
      </Text>
      <Text style={styles.resultValue}>
        • Add more accounts or profiles
      </Text>
      <Text style={styles.resultValue}>
        • Access all wallet features from the menu
      </Text>

      <Text
        style={[
          styles.resultValue,
          {
            marginTop: 15,
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center",
          },
        ]}
      >
        You'll be automatically taken to your wallet in a few seconds...
      </Text>

      <ActionButton
        text="Enter Wallet Now"
        onPress={onFinish}
        style={{ marginTop: 20 }}
        accessibilityLabel="Complete setup and enter wallet immediately"
      />
    </SectionContainer>
  );
};
