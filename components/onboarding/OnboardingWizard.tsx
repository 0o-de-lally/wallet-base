import React, { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { PinCreationFlow } from "../pin-input/PinCreationFlow";
import { useModal } from "../../context/ModalContext";
import AddAccountForm from "../profile/AddAccountForm";
import RecoverAccountForm from "../profile/RecoverAccountForm";

type WizardStep =
  | "welcome"
  | "account-choice"
  | "account-setup"
  | "complete";

interface OnboardingWizardProps {
  onComplete: () => void;
}

/**
 * Onboarding wizard for first-time users
 * Guides users through PIN setup and account creation/recovery
 */
export const OnboardingWizard: React.FC<OnboardingWizardProps> = observer(
  ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
    const [pinCreationVisible, setPinCreationVisible] = useState(false);
    const [accountChoice, setAccountChoice] = useState<
      "create" | "recover" | null
    >(null);

    const { showAlert } = useModal();

    console.log("OnboardingWizard render:", { currentStep, pinCreationVisible });

    // Reset form callback for account forms
    const resetAccountForm = useCallback(() => {
      // This will be called by the account forms when they need to reset
    }, []);

    const handleStartPinCreation = useCallback(() => {
      console.log("OnboardingWizard: Starting PIN creation");
      setPinCreationVisible(true);
    }, []);

    const handlePinCreationComplete = useCallback(
      (success: boolean) => {
        console.log("OnboardingWizard: PIN creation completed with success:", success);
        setPinCreationVisible(false);

        if (success) {
          setCurrentStep("account-choice");
        } else {
          // On failure, go back to welcome step
          setCurrentStep("welcome");
        }
      },
      [],
    );

    const handlePinCreationCancel = useCallback(() => {
      setPinCreationVisible(false);
      setCurrentStep("welcome");
    }, []);

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
              <Text
                style={[
                  styles.resultValue,
                  { marginTop: 15, fontStyle: "italic" },
                ]}
              >
                This should only take a few minutes.
              </Text>

              <ActionButton
                text="Create PIN"
                onPress={handleStartPinCreation}
                style={{ marginTop: 20 }}
                accessibilityLabel="Start PIN creation for wallet setup"
              />
            </SectionContainer>
          );

        case "account-choice":
          return (
            <SectionContainer title="Account Setup">
              <Text style={styles.resultValue}>
                Great! Your PIN is set up. Now let&apos;s add your first
                account:
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

              <Text
                style={[
                  styles.resultValue,
                  { marginTop: 15, fontSize: 12, fontStyle: "italic" },
                ]}
              >
                You can always add more accounts later from the main menu.
              </Text>
            </SectionContainer>
          );

        case "account-setup":
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
          <Text
            style={[styles.resultValue, { textAlign: "center", fontSize: 12 }]}
          >
            Step{" "}
            {currentStep === "welcome"
              ? "1"
              : currentStep === "account-choice" ||
                    currentStep === "account-setup"
                  ? "2"
                  : "3"}{" "}
            of 3
          </Text>
        </View>

        {renderStep()}

        {/* PIN Creation Flow */}
        <PinCreationFlow
          visible={pinCreationVisible}
          onComplete={handlePinCreationComplete}
          onCancel={handlePinCreationCancel}
          showSuccessAlert={true}
        />
      </ScrollView>
    );
  },
);

OnboardingWizard.displayName = "OnboardingWizard";
