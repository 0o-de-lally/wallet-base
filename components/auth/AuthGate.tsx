import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ActionButton } from "../common/ActionButton";
import * as LocalAuthentication from "expo-local-authentication";
import { styles } from "../../styles/styles";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Function to authenticate the user
  const authenticate = async () => {
    try {
      setIsLoading(true);
      setSecurityError(null);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // If device doesn't support biometrics or has no enrollments, block access
      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(false);
        setSecurityError(
          !hasHardware
            ? "Your device doesn't support biometric authentication"
            : "No biometric or PIN security is enrolled on your device",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your wallet",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      setIsAuthenticated(result.success);

      if (!result.success) {
        setSecurityError("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setIsAuthenticated(false);
      setSecurityError("Authentication error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt authentication when component mounts
  useEffect(() => {
    authenticate();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.authContainer}>
        <ActivityIndicator
          size="large"
          color={styles.authButton.backgroundColor}
        />
        <Text style={styles.authText}>Verifying device security...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Authentication Required</Text>

        {securityError ? (
          <>
            <Text style={[styles.authText, styles.dangerTitle]}>
              {securityError}
            </Text>
            {(securityError.includes("doesn't support") ||
              securityError.includes("enrolled")) && (
              <Text style={styles.authText}>
                For security reasons, this app requires device biometrics or
                PIN/password protection. Please set up device security in your
                settings to use this app.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.authText}>
            Please authenticate to access your wallet.
          </Text>
        )}

        {!securityError ||
        (!securityError.includes("doesn't support") &&
          !securityError.includes("enrolled")) ? (
          <ActionButton
            text="Authenticate"
            onPress={authenticate}
            style={styles.authButton}
            accessibilityLabel="Authenticate with device security"
          />
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}
