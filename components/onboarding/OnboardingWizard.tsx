import React, { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { PinInputModal } from "../pin-input/PinInputModal";
import { hashPin, validatePin } from "../../util/pin-security";
import { saveValue } from "../../util/secure-store";
import { useModal } from "../../context/ModalContext";
import AddAccountForm from "../profile/AddAccountForm";
import RecoverAccountForm from "../profile/RecoverAccountForm";

type WizardStep = "welcome" | "pin-setup" | "pin-confirm" | "account-choice" | "account-setup" | "complete";

interface OnboardingWizardProps {
  onComplete: () => void;
}

/**
 * Onboarding wizard for first-time users
 * Guides users through PIN setup and account creation/recovery
 */
export const OnboardingWizard: React.FC<OnboardingWizardProps> = observer(({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [accountChoice, setAccountChoice] = useState<"create" | "recover" | null>(null);

  const { showAlert } = useModal();

  // Reset form callback for account forms
  const resetAccountForm = useCallback(() => {
    // This will be called by the account forms when they need to reset
  }, []);

  const handleStartSetup = useCallback(() => {
    setCurrentStep("pin-setup");
    setPinModalVisible(true);
  }, []);

  const handlePinSetup = useCallback(async (pin: string) => {
    if (!validatePin(pin)) {
      showAlert("Invalid PIN", "PIN must be exactly 6 digits");
      return;
    }

    setTempPin(pin);
    setPinModalVisible(false);
    setCurrentStep("pin-confirm");
    // Small delay to ensure modal closes before opening the next one
    setTimeout(() => setPinModalVisible(true), 100);
  }, [showAlert]);

  const handlePinConfirm = useCallback(async (confirmPin: string) => {
    if (!tempPin) {
      showAlert("Error", "No PIN to confirm");
      return;
    }

    if (confirmPin !== tempPin) {
      showAlert("PIN Mismatch", "PINs do not match. Please try again.");
      setCurrentStep("pin-setup");
      setTempPin(null);
      return;
    }

    try {
      // Hash and save the PIN
      const hashedPin = await hashPin(confirmPin);
      await saveValue("user_pin", JSON.stringify(hashedPin));

      setPinModalVisible(false);
      setTempPin(null);
      setCurrentStep("account-choice");

      showAlert("Success", "PIN created successfully!");
    } catch (error) {
      showAlert("Error", "Failed to save PIN. Please try again.");
      console.error("PIN save error:", error);
      setCurrentStep("pin-setup");
      setTempPin(null);
    }
  }, [tempPin, showAlert]);

  const handleAccountChoice = useCallback((choice: "create" | "recover") => {
    setAccountChoice(choice);
    setCurrentStep("account-setup");
  }, []);

  const handleAccountSetupComplete = useCallback(() => {
    setCurrentStep("complete");
  }, []);

  const handleFinishWizard = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleBackToChoice = useCallback(() => {
    setAccountChoice(null);
    setCurrentStep("account-choice");
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <SectionContainer title="Welcome to Your Wallet">
            <Text style={styles.resultValue}>
              Let&apos;s get you set up! This wizard will guide you through:
            </Text>
            <Text style={[styles.resultValue, { marginTop: 10 }]}>
              • Creating a secure PIN for your wallet
            </Text>
            <Text style={styles.resultValue}>
              • Setting up your first account
            </Text>
            <Text style={[styles.resultValue, { marginTop: 15, fontStyle: 'italic' }]}>
              This should only take a few minutes.
            </Text>

            <ActionButton
              text="Get Started"
              onPress={handleStartSetup}
              style={{ marginTop: 20 }}
              accessibilityLabel="Start wallet setup wizard"
            />
          </SectionContainer>
        );

      case "account-choice":
        return (
          <SectionContainer title="Account Setup">
            <Text style={styles.resultValue}>
              Great! Your PIN is set up. Now let&apos;s add your first account:
            </Text>

            <ActionButton
              text="Create New Account"
              onPress={() => handleAccountChoice("create")}
              style={{ marginTop: 20 }}
              accessibilityLabel="Create a new account"
            />

            <ActionButton
              text="Recover Existing Account"
              onPress={() => handleAccountChoice("recover")}
              style={{ marginTop: 10 }}
              accessibilityLabel="Recover an existing account"
            />

            <Text style={[styles.resultValue, { marginTop: 15, fontSize: 12, fontStyle: 'italic' }]}>
              You can always add more accounts later from the main menu.
            </Text>
          </SectionContainer>
        );

      case "account-setup":
        return (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <ActionButton
                text="← Back"
                onPress={handleBackToChoice}
                size="small"
                accessibilityLabel="Go back to account choice"
              />
            </View>

            {accountChoice === "create" && (
              <AddAccountForm
                profileName="mainnet" // Use the default profile
                onComplete={handleAccountSetupComplete}
                onResetForm={resetAccountForm}
              />
            )}

            {accountChoice === "recover" && (
              <RecoverAccountForm
                profileName="mainnet" // Use the default profile
                onComplete={handleAccountSetupComplete}
                onResetForm={resetAccountForm}
              />
            )}
          </View>
        );

      case "complete":
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

            <ActionButton
              text="Enter Wallet"
              onPress={handleFinishWizard}
              style={{ marginTop: 20 }}
              accessibilityLabel="Complete setup and enter wallet"
            />
          </SectionContainer>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Wallet Setup</Text>

      {/* Progress indicator */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.resultValue, { textAlign: 'center', fontSize: 12 }]}>
          Step {currentStep === "welcome" ? "1" :
                currentStep === "pin-setup" || currentStep === "pin-confirm" ? "2" :
                currentStep === "account-choice" || currentStep === "account-setup" ? "3" : "4"} of 4
        </Text>
      </View>

      {renderStep()}

      {/* PIN Setup Modals */}
      <PinInputModal
        visible={pinModalVisible && (currentStep === "pin-setup" || currentStep === "pin-confirm")}
        onClose={() => {
          setPinModalVisible(false);
          if (currentStep === "pin-setup" || currentStep === "pin-confirm") {
            setCurrentStep("welcome");
            setTempPin(null);
          }
        }}
        onPinAction={currentStep === "pin-setup" ? handlePinSetup : handlePinConfirm}
        purpose="save"
        actionTitle={currentStep === "pin-setup" ? "Create Your PIN" : "Confirm Your PIN"}
        actionSubtitle={
          currentStep === "pin-setup"
            ? "Choose a 6-digit PIN to secure your wallet"
            : "Enter your PIN again to confirm"
        }
      />
    </ScrollView>
  );
});

OnboardingWizard.displayName = "OnboardingWizard";
