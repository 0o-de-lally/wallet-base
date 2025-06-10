import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { useSetupGuard } from "../../hooks/use-setup-guard";
import { OnboardingWizard } from "../onboarding/OnboardingWizard";
import { styles } from "../../styles/styles";

interface SetupGuardProps {
  children: React.ReactNode;
  requiresPin?: boolean;
  requiresAccount?: boolean;
  redirectOnComplete?: boolean;
}

/**
 * Guard component that ensures users have completed necessary setup steps
 * before accessing protected screens. This component is reactive to state changes.
 */
export const SetupGuard: React.FC<SetupGuardProps> = observer(
  ({
    children,
    requiresPin = true,
    requiresAccount = true,
    redirectOnComplete = true,
  }) => {
    const { setupStatus, checkSetupStatus } = useSetupGuard();
    const router = useRouter();

    // Add debugging to track setup status changes
    useEffect(() => {
      console.log("SetupGuard: Setup status changed:", {
        setupStatus,
        requiresPin,
        requiresAccount,
        redirectOnComplete,
        timestamp: new Date().toISOString(),
      });
    }, [setupStatus, requiresPin, requiresAccount, redirectOnComplete]);

    const handleOnboardingComplete = async () => {
      console.log("SetupGuard: Onboarding completed, rechecking status");

      // Recheck setup status after onboarding
      await checkSetupStatus();

      // Small delay to ensure state has updated
      setTimeout(() => {
        // Optionally redirect to home after onboarding
        if (redirectOnComplete) {
          router.replace("/");
        }
      }, 100);
    };

    // Show loading while checking setup status
    if (setupStatus === "loading") {
      return (
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color="#94c2f3" />
          <Text style={[styles.resultValue, { marginTop: 10 }]}>
            Checking setup status...
          </Text>
        </View>
      );
    }

    // Show onboarding if user needs PIN setup
    if (requiresPin && setupStatus === "needs-pin") {
      console.log("SetupGuard: User needs PIN, showing onboarding");
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
    }

    // Show onboarding if user needs account setup
    if (requiresAccount && setupStatus === "needs-account") {
      console.log("SetupGuard: User needs account, showing onboarding");
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
    }

    // User has completed required setup, show the protected content
    console.log("SetupGuard: Setup complete, showing protected content");
    return <>{children}</>;
  },
);
