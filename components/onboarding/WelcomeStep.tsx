import React from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface WelcomeStepProps {
  onStartPinCreation: () => void;
  onResetApp: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onStartPinCreation,
  onResetApp,
}) => {
  return (
    <SectionContainer title="Welcome to Your Wallet">
      <Text style={styles.resultValue}>
        Let&apos;s get you set up! This wizard will guide you through:
      </Text>
      <Text style={[styles.resultValue, { marginTop: 10 }]}>
        • Creating a secure PIN for your wallet
      </Text>
      <Text style={styles.resultValue}>• Setting up your first account</Text>
      <Text
        style={[styles.resultValue, { marginTop: 15, fontStyle: "italic" }]}
      >
        This should only take a few minutes.
      </Text>

      <ActionButton
        text="Create PIN"
        onPress={onStartPinCreation}
        style={{ marginTop: 20 }}
        accessibilityLabel="Start PIN creation for wallet setup"
      />

      <Text
        style={[
          styles.resultValue,
          {
            marginTop: 30,
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center",
          },
        ]}
      >
        Need to start over?
      </Text>

      <ActionButton
        text="Reset All Data"
        onPress={onResetApp}
        style={{
          marginTop: 5,
          backgroundColor: "#ff4444",
          borderColor: "#ff4444",
        }}
        textStyle={{ color: "white" }}
        size="small"
        accessibilityLabel="Reset all app data and start fresh"
      />
    </SectionContainer>
  );
};
