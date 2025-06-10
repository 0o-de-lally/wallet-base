import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, ScrollView } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { PinCreationFlow } from "../pin-input/PinCreationFlow";
import { useModal } from "../../context/ModalContext";
import { hasCompletedBasicSetup, hasAccounts } from "../../util/user-state";
import {
  maybeInitializeDefaultProfile,
  appConfig,
} from "../../util/app-config-store";
import { resetAppToFirstTimeUser } from "../../util/dev-utils";
import { refreshSetupStatus } from "../../util/setup-state";
import { WelcomeStep } from "./WelcomeStep";
import { AccountChoiceStep } from "./AccountChoiceStep";
import { AccountSetupStep } from "./AccountSetupStep";
import { CompleteStep } from "./CompleteStep";

type WizardStep = "welcome" | "account-choice" | "account-setup" | "complete";

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
    const [isCheckingPinStatus, setIsCheckingPinStatus] = useState(true);

    const { showAlert, showConfirmation } = useModal();

    // Track if onboarding has completed to prevent duplicate completion calls
    const hasCompletedRef = useRef(false);

    console.log("OnboardingWizard render:", {
      currentStep,
      pinCreationVisible,
      isCheckingPinStatus,
    });

    // Check if PIN and accounts already exist on mount
    useEffect(() => {
      const checkSetupStatus = async () => {
        try {
          // Wait a bit for potential app config hydration
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Ensure we have a default profile before checking setup status
          try {
            // More robust check for appConfig availability
            if (appConfig) {
              const profiles = appConfig.profiles?.get();
              if (!profiles || Object.keys(profiles).length === 0) {
                console.log(
                  "OnboardingWizard: No profiles found, initializing default profile",
                );
                maybeInitializeDefaultProfile();

                // Wait a bit for the profile to be created
                await new Promise((resolve) => setTimeout(resolve, 50));
              } else {
                console.log(
                  "OnboardingWizard: Found existing profiles:",
                  Object.keys(profiles),
                );
              }
            } else {
              console.log(
                "OnboardingWizard: AppConfig not yet available, initializing default profile",
              );
              maybeInitializeDefaultProfile();

              // Wait a bit for the profile to be created
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          } catch (profileError) {
            console.log(
              "OnboardingWizard: Error checking/initializing profiles:",
              profileError,
            );
            // Try to initialize anyway
            try {
              maybeInitializeDefaultProfile();
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (initError) {
              console.error(
                "OnboardingWizard: Failed to initialize default profile:",
                initError,
              );
            }
          }

          const hasPin = await hasCompletedBasicSetup();
          const hasUserAccounts = hasAccounts();

          console.log("OnboardingWizard: Setup status check:", {
            hasPin,
            hasUserAccounts,
            currentStep,
          });

          // Always check if setup is complete regardless of current step
          if (hasPin && hasUserAccounts) {
            console.log(
              "OnboardingWizard: Setup is already complete, finishing onboarding immediately",
            );
            hasCompletedRef.current = true;
            onComplete();
            return;
          }

          // Only adjust step if we're still on the initial welcome step
          if (currentStep === "welcome") {
            if (hasPin && !hasUserAccounts) {
              console.log(
                "OnboardingWizard: PIN exists but no accounts, skipping to account-choice",
              );
              setCurrentStep("account-choice");
            } else {
              console.log("OnboardingWizard: No PIN, staying on welcome step");
              // Stay on welcome step - user needs to create PIN first
            }
          }
        } catch (error) {
          console.error(
            "OnboardingWizard: Error checking setup status:",
            error,
          );
        } finally {
          setIsCheckingPinStatus(false);
        }
      };

      checkSetupStatus();
    }, [onComplete]); // Remove currentStep dependency to avoid infinite loops

    // Reset form callback for account forms
    const resetAccountForm = useCallback(() => {
      // This will be called by the account forms when they need to reset
    }, []);

    const handleStartPinCreation = useCallback(() => {
      console.log("OnboardingWizard: Starting PIN creation");
      setPinCreationVisible(true);
    }, []);

    const handlePinCreationComplete = useCallback(async (success: boolean) => {
      // Prevent duplicate completion calls
      if (hasCompletedRef.current) return;

      console.log(
        "OnboardingWizard: PIN creation completed with success:",
        success,
      );
      setPinCreationVisible(false);

      if (success) {
        // Force immediate refresh of setup status
        refreshSetupStatus();

        // Check current status after PIN creation
        try {
          await new Promise(resolve => setTimeout(resolve, 100));

          const hasPin = await hasCompletedBasicSetup();
          const hasUserAccounts = hasAccounts();

          console.log("OnboardingWizard: Post-PIN-creation status:", {
            hasPin,
            hasUserAccounts,
          });

          if (hasPin && hasUserAccounts) {
            console.log("OnboardingWizard: Setup fully complete after PIN creation, finishing onboarding");
            hasCompletedRef.current = true;
            onComplete();
          } else if (hasPin && !hasUserAccounts) {
            console.log("OnboardingWizard: PIN created, advancing to account choice");
            setCurrentStep("account-choice");
          } else {
            console.log("OnboardingWizard: PIN creation verification failed, staying on welcome");
            setCurrentStep("welcome");
          }
        } catch (error) {
          console.error("OnboardingWizard: Error checking status after PIN creation:", error);
          setCurrentStep("account-choice"); // Fallback
        }
      } else {
        // On failure, go back to welcome step
        setCurrentStep("welcome");
      }
    }, [onComplete]);

    const handlePinCreationCancel = useCallback(() => {
      setPinCreationVisible(false);
      setCurrentStep("welcome");
    }, []);

    const handleAccountChoice = useCallback((choice: "create" | "recover") => {
      setAccountChoice(choice);
      setCurrentStep("account-setup");
    }, []);

    const handleAccountSetupComplete = useCallback(async () => {
      // Prevent duplicate completion calls
      if (hasCompletedRef.current) return;

      console.log(
        "OnboardingWizard: Account setup completed, checking if setup is fully complete",
      );

      // Force immediate refresh of setup status
      refreshSetupStatus();

      // Check if setup is now fully complete
      try {
        // Small delay to allow for state propagation
        await new Promise(resolve => setTimeout(resolve, 300)); // Increased from 100ms

        const hasPin = await hasCompletedBasicSetup();
        const hasUserAccounts = hasAccounts();

        console.log("OnboardingWizard: Post-account-setup status:", {
          hasPin,
          hasUserAccounts,
          delay: "300ms",
        });

        if (hasPin && hasUserAccounts) {
          console.log("OnboardingWizard: Setup is fully complete, advancing to complete step");
          setCurrentStep("complete");
        } else {
          console.log("OnboardingWizard: Setup not fully complete yet, staying on current step");
          // This might happen if there was an error or the account creation failed
        }
      } catch (error) {
        console.error("OnboardingWizard: Error checking setup completion after account setup:", error);
        // Fallback to complete step
        setCurrentStep("complete");
      }
    }, []);

    const handleFinishWizard = useCallback(() => {
      hasCompletedRef.current = true;
      onComplete();
    }, [onComplete]);

    // Auto-advance from complete step after showing success message
    useEffect(() => {
      if (currentStep === "complete") {
        console.log(
          "OnboardingWizard: On complete step, will auto-advance in 3 seconds",
        );
        const timer = setTimeout(() => {
          console.log("OnboardingWizard: Auto-advancing from complete step");
          handleFinishWizard();
        }, 3000); // 3 second delay to show success message

        return () => clearTimeout(timer);
      }
    }, [currentStep, handleFinishWizard]);

    const handleBackToChoice = useCallback(() => {
      setAccountChoice(null);
      setCurrentStep("account-choice");
    }, []);

    // Helper function to check if setup is actually complete
    const checkIfSetupComplete = useCallback(async () => {
      try {
        const hasPin = await hasCompletedBasicSetup();
        const hasUserAccounts = hasAccounts();
        return hasPin && hasUserAccounts;
      } catch (error) {
        console.error("Error checking setup completion:", error);
        return false;
      }
    }, []);

    // Handler to skip to main app if setup is complete
    const handleSkipToMainApp = useCallback(async () => {
      const isComplete = await checkIfSetupComplete();
      if (isComplete) {
        console.log("OnboardingWizard: Setup verified as complete, skipping to main app");
        hasCompletedRef.current = true;
        onComplete();
      } else {
        showAlert("Setup Incomplete", "Please complete the setup process first.");
      }
    }, [checkIfSetupComplete, onComplete, showAlert]);

    const handleResetApp = useCallback(async () => {
      try {
        console.log("OnboardingWizard: Starting app reset");

        // Show confirmation first
        showConfirmation(
          "Reset All Data?",
          "This will permanently delete all your PINs, accounts, and data. This action cannot be undone.",
          async () => {
            try {
              await resetAppToFirstTimeUser();

              // Reset the wizard state
              setCurrentStep("welcome");
              setPinCreationVisible(false);
              setAccountChoice(null);
              setIsCheckingPinStatus(false);

              showAlert(
                "Data Cleared",
                "All app data has been reset. You can now start fresh.",
              );
            } catch (error) {
              console.error("OnboardingWizard: Error resetting app:", error);
              showAlert(
                "Reset Failed",
                "Failed to reset app data. Please try again.",
              );
            }
          },
          "Reset Everything",
          true, // isDestructive
        );
      } catch (error) {
        console.error("OnboardingWizard: Error in handleResetApp:", error);
        showAlert("Error", "Failed to reset app data. Please try again.");
      }
    }, [showAlert, showConfirmation]);

    const renderStep = () => {
      switch (currentStep) {
        case "welcome":
          return (
            <WelcomeStep
              onStartPinCreation={handleStartPinCreation}
              onResetApp={handleResetApp}
            />
          );

        case "account-choice":
          return (
            <AccountChoiceStep
              onAccountChoice={handleAccountChoice}
              onSkipToMainApp={handleSkipToMainApp}
              onResetApp={handleResetApp}
            />
          );

        case "account-setup":
          return (
            <AccountSetupStep
              accountChoice={accountChoice}
              onBackToChoice={handleBackToChoice}
              onComplete={handleAccountSetupComplete}
              onResetForm={resetAccountForm}
            />
          );

        case "complete":
          return <CompleteStep onFinish={handleFinishWizard} />;

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

        {/* Show loading while checking setup status */}
        {isCheckingPinStatus ? (
          <SectionContainer title="Checking Setup Status">
            <Text style={styles.resultValue}>
              Checking your PIN and account status...
            </Text>
          </SectionContainer>
        ) : (
          <>
            {/* Progress indicator */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={[
                  styles.resultValue,
                  { textAlign: "center", fontSize: 12 },
                ]}
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
          </>
        )}

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
