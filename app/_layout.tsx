import React, { useEffect, useState, useRef } from "react";
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
// Track app startup performance
const startupTimestamp = Date.now();
console.log(`[STARTUP] App component loaded: ${0}ms`);

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

  // Add timing states
  const [elapsedTime, setElapsedTime] = useState(0);
  const [initStartTime, setInitStartTime] = useState(0);
  const [initCompleteTime, setInitCompleteTime] = useState(0);
  const [authStartTime, setAuthStartTime] = useState(0);
  const [authCompleteTime, setAuthCompleteTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer display
  useEffect(() => {
    // Set up timer to update elapsed time every 100ms
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startupTimestamp);
    }, 100);

    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Function to authenticate the user
  const authenticate = async () => {
    try {
      const authStart = Date.now();
      setAuthStartTime(authStart - startupTimestamp);
      console.log(`[STARTUP] Authentication started: ${authStart - startupTimestamp}ms`);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // If device doesn't support biometrics or has no enrollments, default to allowing access
      if (!hasHardware || !isEnrolled) {
        console.log(`[STARTUP] No biometrics available: ${Date.now() - startupTimestamp}ms`);
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your wallet",
        fallbackLabel: "Use passcode",
      });

      setIsAuthenticated(result.success);
      console.log(`[STARTUP] Authentication ${result.success ? 'succeeded' : 'failed'}: ${Date.now() - startupTimestamp}ms`);
    } catch (error) {
      console.error("Authentication error:", error);
      // On error, allow access by default for better user experience
      setIsAuthenticated(true);
    } finally {
      setAuthCompleteTime(Date.now() - startupTimestamp);
      console.log(`[STARTUP] Authentication complete: ${Date.now() - startupTimestamp}ms`);
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const initStart = Date.now();
        setInitStartTime(initStart - startupTimestamp);
        console.log(`[STARTUP] Initialization started: ${initStart - startupTimestamp}ms`);

        // Wrap initializeApp in performance measurement
        console.time('initializeApp');
        await initializeApp();
        console.timeEnd('initializeApp');

        const initDone = Date.now();
        setInitCompleteTime(initDone - startupTimestamp);
        console.log(`[STARTUP] Initialization complete: ${initDone - startupTimestamp}ms`);

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

  // Debugging component to show timing information
  const TimingDebug = () => (
    <View style={{ position: 'absolute', top: 40, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 5 }}>
      <Text style={{ color: '#fff', fontSize: 12 }}>Total: {elapsedTime}ms</Text>
      {initStartTime > 0 && <Text style={{ color: '#fff', fontSize: 12 }}>Init start: {initStartTime}ms</Text>}
      {initCompleteTime > 0 && <Text style={{ color: '#fff', fontSize: 12 }}>Init done: {initCompleteTime}ms</Text>}
      {authStartTime > 0 && <Text style={{ color: '#fff', fontSize: 12 }}>Auth start: {authStartTime}ms</Text>}
      {authCompleteTime > 0 && <Text style={{ color: '#fff', fontSize: 12 }}>Auth done: {authCompleteTime}ms</Text>}
    </View>
  );

  if (!isInitialized) {
    return (
      <Layout>
        {initError ? (
          <>
            <InitializationError error={initError} />
            <TimingDebug />
          </>
        ) : (
          <>
            <InitializingApp />
            <TimingDebug />
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
          <TimingDebug />
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
          <TimingDebug />
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
      <TimingDebug />
    </Layout>
  );
});

export default RootLayout;
