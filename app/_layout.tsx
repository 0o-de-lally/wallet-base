import "../util/polyfills";

import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import TestModuleExposer from "./_tests";
import { ModalProvider } from "../context/ModalContext";
import { observer } from "@legendapp/state/react";
import { initializeApp } from "../util/initialize-app";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import {
  hasHardwareAsync,
  isEnrolledAsync,
  authenticateAsync,
} from "expo-local-authentication";
import { View, StatusBar } from "react-native";
import { AuthenticationView } from "../components/auth/AuthenticationView";
import { InitializationError } from "@/components/InitializationError";
import { InitializingApp } from "@/components/InitializingApp";
import { PrivacyOverlay } from "../components/privacy/PrivacyOverlay";
import { ScreenCaptureProtectionProvider } from "../context/ScreenCaptureProtectionContext";
import { styles } from "../styles/styles";
import { devLog, devError } from "../util/error-utils";

// Enable screens for react-native-screens
enableScreens();

// Layout wrapper to avoid duplication - includes global providers and security context
const Layout = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>
    <ModalProvider>
      <ScreenCaptureProtectionProvider>
        <View style={styles.appWrapper}>
          <StatusBar backgroundColor={styles.statusBar.backgroundColor} />
          {children}
        </View>
      </ScreenCaptureProtectionProvider>
    </ModalProvider>
  </SafeAreaProvider>
);

// App layout with navigation and global providers
const RootLayout = observer(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Function to authenticate the user
  const authenticate = async () => {
    try {
      setAuthChecking(true);
      setAuthError(null);

      const hasHardware = await hasHardwareAsync();
      const isEnrolled = await isEnrolledAsync();

      // If device doesn't support biometrics or has no enrollments, default to allowing access
      if (!hasHardware || !isEnrolled) {
        devLog("Biometric authentication not available, allowing access");
        setIsAuthenticated(true);
        return;
      }

      const result = await authenticateAsync({
        promptMessage: "Authenticate",
        fallbackLabel: "Use passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        // User cancelled or authentication failed
        if (result.error === "user_cancel") {
          setAuthError("Authentication was cancelled. Please try again.");
        } else {
          setAuthError("Authentication failed. Please try again.");
        }
        setIsAuthenticated(false);
      }
    } catch (error) {
      devError("Authentication", error);
      setAuthError("Authentication error occurred. Please try again.");
      // On error, allow access by default for better user experience
      setIsAuthenticated(true);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        await initializeApp();
        setIsInitialized(true);
        // Trigger authentication after initialization
        authenticate();
      } catch (error) {
        devError("App initialization", error);
        setInitError(error instanceof Error ? error : new Error(String(error)));
        setAuthChecking(false);
      }
    }

    init();
  }, []);

  if (!isInitialized) {
    return (
      <Layout>
        {initError ? (
          <InitializationError error={initError} />
        ) : (
          <InitializingApp />
        )}
      </Layout>
    );
  }

  if (authChecking) {
    return (
      <Layout>
        <AuthenticationView isLoading={true} onAuthenticate={authenticate} />
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthenticationView
          isLoading={false}
          onAuthenticate={authenticate}
          subtitle={authError || "Please authenticate to access your wallet."}
        />
      </Layout>
    );
  }

  // Return main app if authenticated
  return (
    <Layout>
      {__DEV__ && <TestModuleExposer />}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: styles.headerContainer.backgroundColor,
          },
          headerTintColor: styles.authText.color,
          contentStyle: {
            backgroundColor: styles.headerContainer.backgroundColor,
          },
          animation: "fade",
        }}
      />
      {/* Privacy overlay that activates when app goes to background */}
      <PrivacyOverlay message="Return to continue using your wallet securely" />
    </Layout>
  );
});

export default RootLayout;
