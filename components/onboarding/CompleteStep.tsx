import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface CompleteStepProps {
  onFinish: () => void;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({ onFinish }) => {
  return (
    <SectionContainer title="Setup Complete!">
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Ionicons 
          name="checkmark-circle" 
          size={20} 
          color={colors.green} 
          style={{ marginRight: 8 }}
        />
        <Text style={styles.resultValue}>
          Congratulations! Your wallet is now set up and ready to use.
        </Text>
      </View>
      <Text style={[styles.resultValue, { marginTop: 10 }]}>You can now:</Text>
      <Text style={styles.resultValue}>• View and manage your accounts</Text>
      <Text style={styles.resultValue}>• Add more accounts or profiles</Text>
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
        You&apos;ll be automatically taken to your wallet in a few seconds...
      </Text>

      <ActionButton
        text="Enter Wallet Now"
        onPress={onFinish}
        style={styles.buttonSpacingDefault}
        accessibilityLabel="Complete setup and enter wallet immediately"
      />
    </SectionContainer>
  );
};
