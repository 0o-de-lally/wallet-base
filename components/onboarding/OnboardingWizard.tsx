import React, { useState, useCallback, useEffect } from "react";
import { Text, ScrollView } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { PinCreationFlow } from "../pin-input/PinCreationFlow";
import { useModal } from "../../context/ModalContext";
import { hasPINSetup, hasAccounts } from "../../util/user-state";
import { maybeInitializeDefaultProfile } from "../../util/app-config-store";
import { resetAppToFirstTimeUser } from "../../util/dev-utils";
import { WelcomeStep } from "./WelcomeStep";
import { AccountChoiceStep } from "./AccountChoiceStep";
import { AccountSetupStep } from "./AccountSetupStep";

interface OnboardingWizardProps {
  onComplete: () => void;
}

/**
 * Onboarding wizard for first-time users
 * Simplified to only determine view based on PIN and account status
 */
export const OnboardingWizard: React.FC<OnboardingWizardProps> = observer(
  ({ onComplete }) => {
    const [pinCreationVisible, setPinCreationVisible] = useState(false);
    const [accountChoice, setAccountChoice] = useState<
      "create" | "recover" | null
    >(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPin, setHasPin] = useState(false);
    const [hasUserAccounts, setHasUserAccounts] = useState(false);

    const { showAlert, showConfirmation } = useModal();

    // Check current status
    const checkStatus = useCallback(async () => {
      try {
        maybeInitializeDefaultProfile();
        await new Promise((resolve) => setTimeout(resolve, 100)); // Brief delay for initialization

        const pinExists = await hasPINSetup();
        const accountsExist = hasAccounts();

        setHasPin(pinExists);
        setHasUserAccounts(accountsExist);

        // If setup is complete, finish immediately
        if (pinExists && accountsExist) {
          onComplete();
          return;
        }
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setIsLoading(false);
      }
    }, [onComplete]);

    // Initial status check
    useEffect(() => {
      checkStatus();
    }, [checkStatus]);

    // Determine which view to show
    const getCurrentView = () => {
      if (!hasPin) return "welcome";
      if (!hasUserAccounts) return "account-choice";
      return "complete"; // This shouldn't happen due to early completion above
    };

    const handlePinCreationComplete = useCallback(
      async (success: boolean) => {
        setPinCreationVisible(false);
        if (success) {
          await checkStatus(); // Re-check status after PIN creation
        }
      },
      [checkStatus],
    );

    const handleAccountSetupComplete = useCallback(async () => {
      await checkStatus(); // Re-check status after account creation
    }, [checkStatus]);

    const handleResetApp = useCallback(async () => {
      showConfirmation(
        "Reset All Data?",
        "This will permanently delete all your PINs, accounts, and data. This action cannot be undone.",
        async () => {
          try {
            await resetAppToFirstTimeUser();
            await checkStatus(); // Re-check after reset
            showAlert(
              "Data Cleared",
              "All app data has been reset. You can now start fresh.",
            );
          } catch (error) {
            console.error("Error resetting app:", error);
            showAlert(
              "Reset Failed",
              "Failed to reset app data. Please try again.",
            );
          }
        },
        "Reset Everything",
        true,
      );
    }, [showAlert, showConfirmation, checkStatus]);

    const renderCurrentView = () => {
      const currentView = getCurrentView();

      switch (currentView) {
        case "welcome":
          return (
            <WelcomeStep
              onStartPinCreation={() => setPinCreationVisible(true)}
              onResetApp={handleResetApp}
            />
          );

        case "account-choice":
          if (accountChoice) {
            return (
              <AccountSetupStep
                accountChoice={accountChoice}
                onBackToChoice={() => setAccountChoice(null)}
                onComplete={handleAccountSetupComplete}
                onResetForm={() => {}} // Simple no-op
              />
            );
          }

          return (
            <AccountChoiceStep
              onAccountChoice={setAccountChoice}
              onResetApp={handleResetApp}
            />
          );

        default:
          return null;
      }
    };

    if (isLoading) {
      return (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Wallet Setup</Text>
          <SectionContainer title="Checking Setup Status">
            <Text style={styles.resultValue}>
              Checking your PIN and account status...
            </Text>
          </SectionContainer>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Wallet Setup</Text>

        {renderCurrentView()}

        <PinCreationFlow
          visible={pinCreationVisible}
          onComplete={handlePinCreationComplete}
          onCancel={() => setPinCreationVisible(false)}
          showSuccessAlert={true}
        />
      </ScrollView>
    );
  },
);

OnboardingWizard.displayName = "OnboardingWizard";
