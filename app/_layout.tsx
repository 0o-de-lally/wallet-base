import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { ModalProvider } from "../context/ModalContext";
import { observer } from "@legendapp/state/react";
import { initializeApp } from "../util/initialize-app";
import * as LocalAuthentication from "expo-local-authentication";
import { View, Text, StatusBar, Platform } from "react-native";
import { ActionButton } from "../components/common/ActionButton";
import { InitializationError } from "@/components/InitializationError";
import { InitializingApp } from "@/components/InitializingApp";
import { styles } from "../styles/styles";
import '@/util/crypto-polyfill';

// Layout wrapper to avoid duplication - only includes the ModalProvider once
const Layout = ({ children }: { children: React.ReactNode }) => (
  <ModalProvider>
    <View
      style={{
        flex: 1,
        backgroundColor: styles.headerContainer.backgroundColor,
      }}
    >
      <StatusBar
        backgroundColor={Platform.OS === 'android' ? 'transparent' : styles.statusBar.backgroundColor}
        translucent={Platform.OS === 'android'}
        barStyle="light-content"
      />
      {children}
    </View>
  </ModalProvider>
);

// App layout with navigation and global providers
const RootLayout = observer(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Function to authenticate the user
  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // If device doesn't support biometrics or has no enrollments, default to allowing access
      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your wallet",
        fallbackLabel: "Use passcode",
      });

      setIsAuthenticated(result.success);
    } catch (error) {
      console.error("Authentication error:", error);
      // On error, allow access by default for better user experience
      setIsAuthenticated(true);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        // Initialize the app
        await initializeApp();
        setIsInitialized(true);

        // Trigger authentication after initialization
        authenticate();
      } catch (error) {
        console.error("Failed to initialize:", error);
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
          <>
            <InitializationError error={initError} />
          </>
        ) : (
          <>
            <InitializingApp />
          </>
        )}
      </Layout>
    );
  }

  if (authChecking) {
    return (
      <Layout>
        <View>
          <Text style={styles.authText}>Verifying device security...</Text>
        </View>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Authentication Required</Text>
          <Text style={styles.authText}>
            Please authenticate to access your wallet.
          </Text>
          <ActionButton
            text="Authenticate"
            onPress={authenticate}
            style={styles.authButton}
            accessibilityLabel="Authenticate with device security"
          />
        </View>
      </Layout>
    );
  }

  // Return main app if authenticated
  return (
    <Layout>
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
    </Layout>
  );
});

export default RootLayout;
