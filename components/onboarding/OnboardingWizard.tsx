import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { PinCreationFlow } from "../pin-input/PinCreationFlow";
import { useModal } from "../../context/ModalContext";
import AddAccountForm from "../profile/AddAccountForm";
import RecoverAccountForm from "../profile/RecoverAccountForm";
import { hasCompletedBasicSetup, hasAccounts } from "../../util/user-state";
import {
  maybeInitializeDefaultProfile,
  appConfig,
} from "../../util/app-config-store";
import { resetAppToFirstTimeUser } from "../../util/dev-utils";
import { refreshSetupStatus } from "../../util/setup-state";

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

    // Polling mechanism to reactively check setup status changes
    useEffect(() => {
      let pollInterval: ReturnType<typeof setInterval>;

      const pollSetupStatus = async () => {
        try {
          // Only poll if we're not on the complete step (to avoid unnecessary checks)
          if (currentStep !== "complete") {
            console.log("OnboardingWizard: Polling setup status...");

            // Refresh the setup status to ensure it's current
            refreshSetupStatus();

            // Check current setup state
            const hasPin = await hasCompletedBasicSetup();
            const hasUserAccounts = hasAccounts();

            console.log("OnboardingWizard: Poll result:", {
              hasPin,
              hasUserAccounts,
              currentStep,
              timestamp: new Date().toISOString(),
            });

            // If setup is now complete, finish onboarding
            if (hasPin && hasUserAccounts) {
              console.log("OnboardingWizard: Setup completed during polling, finishing onboarding");
              onComplete();
              return;
            }

            // If we have PIN but no accounts and we're still on welcome, advance to account choice
            if (hasPin && !hasUserAccounts && currentStep === "welcome") {
              console.log("OnboardingWizard: PIN detected during polling, advancing to account-choice");
              setCurrentStep("account-choice");
            }
          }
        } catch (error) {
          console.error("OnboardingWizard: Error during polling:", error);
        }
      };

      // Start polling every 2 seconds
      pollInterval = setInterval(pollSetupStatus, 2000);

      // Cleanup on unmount or when step changes to complete
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    }, [currentStep, onComplete]);

    // Reset form callback for account forms
    const resetAccountForm = useCallback(() => {
      // This will be called by the account forms when they need to reset
    }, []);

    const handleStartPinCreation = useCallback(() => {
      console.log("OnboardingWizard: Starting PIN creation");
      setPinCreationVisible(true);
    }, []);

    const handlePinCreationComplete = useCallback(async (success: boolean) => {
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
      console.log(
        "OnboardingWizard: Account setup completed, checking if setup is fully complete",
      );

      // Force immediate refresh of setup status
      refreshSetupStatus();

      // Check if setup is now fully complete
      try {
        // Small delay to allow for state propagation
        await new Promise(resolve => setTimeout(resolve, 100));

        const hasPin = await hasCompletedBasicSetup();
        const hasUserAccounts = hasAccounts();

        console.log("OnboardingWizard: Post-account-setup status:", {
          hasPin,
          hasUserAccounts,
        });

        if (hasPin && hasUserAccounts) {
          console.log("OnboardingWizard: Setup is fully complete, advancing to complete step");
          setCurrentStep("complete");
        } else {
          console.log("OnboardingWizard: Setup not fully complete yet, staying on current step");
          // This might happen if there was an error or the account creation failed
          // The polling mechanism will catch this and handle it appropriately
        }
      } catch (error) {
        console.error("OnboardingWizard: Error checking setup completion after account setup:", error);
        // Fallback to complete step
        setCurrentStep("complete");
      }
    }, []);

    const handleFinishWizard = useCallback(() => {
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
                onPress={handleResetApp}
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

              <Text
                style={[
                  styles.resultValue,
                  {
                    marginTop: 20,
                    fontSize: 12,
                    fontStyle: "italic",
                    textAlign: "center",
                  },
                ]}
              >
                Already have accounts set up?
              </Text>

              <ActionButton
                text="Skip to Main App"
                onPress={handleSkipToMainApp}
                style={{
                  marginTop: 5,
                  backgroundColor: '#4CAF50',
                  borderColor: '#4CAF50',
                }}
                textStyle={{ color: 'white' }}
                size="small"
                accessibilityLabel="Skip to main app if setup is already complete"
              />

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
                Need to start completely over?
              </Text>

              <ActionButton
                text="Reset All Data"
                onPress={handleResetApp}
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
                onPress={handleFinishWizard}
                style={{ marginTop: 20 }}
                accessibilityLabel="Complete setup and enter wallet immediately"
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
