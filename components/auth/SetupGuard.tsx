import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { namedColors } from "../../styles/styles";
import { checkSetupStatus } from "../../hooks/use-setup-guard";
import { OnboardingWizard } from "../onboarding/OnboardingWizard";
import { maybeInitializeDefaultProfile } from "../../util/app-config-store";
import { styles } from "../../styles/styles";

interface SetupGuardProps {
  children: React.ReactNode;
  /** @deprecated use requiresPassword */
  requiresPin?: boolean;
  requiresPassword?: boolean;
  requiresAccount?: boolean;
}

/**
 * Guard component that ensures users have completed necessary setup steps
 * Simplified to just check current status when needed
 */
export const SetupGuard: React.FC<SetupGuardProps> = ({
  children,
  requiresPin,
  requiresPassword,
  requiresAccount = true,
}) => {
  // Normalization: default to requiring password if neither provided
  const effectiveRequiresPassword =
    typeof requiresPassword === "boolean"
      ? requiresPassword
      : typeof requiresPin === "boolean"
        ? requiresPin
        : true;
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkStatus = async () => {
    try {
      maybeInitializeDefaultProfile();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Brief delay for initialization

      const { hasPin, hasUserAccounts, isComplete } = await checkSetupStatus();

      if (isComplete) {
        setNeedsOnboarding(false);
  } else if (effectiveRequiresPassword && !hasPin) {
        setNeedsOnboarding(true);
      } else if (requiresAccount && !hasUserAccounts) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      setNeedsOnboarding(true); // Fail safe
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={namedColors.blue} />
        <Text style={[styles.resultValue, { marginTop: 10 }]}>
          Checking setup status...
        </Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
};
