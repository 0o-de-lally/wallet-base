import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { ModalProvider } from "../context/ModalContext";
import { observer } from "@legendapp/state/react";
import { initializeApp } from "../util/initialize-app";
import { View, StatusBar, Platform } from "react-native";
import { InitializationError } from "@/components/InitializationError";
import { InitializingApp } from "@/components/InitializingApp";
import { AuthGate } from "@/components/auth/AuthGate";
import { styles } from "../styles/styles";
import "@/util/crypto-polyfill";

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
        backgroundColor={
          Platform.OS === "android"
            ? "transparent"
            : styles.statusBar.backgroundColor
        }
        translucent={Platform.OS === "android"}
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

  useEffect(() => {
    async function init() {
      try {
        // Initialize the app
        await initializeApp();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize:", error);
        setInitError(error instanceof Error ? error : new Error(String(error)));
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

  // Return main app inside AuthGate for authentication protection
  return (
    <Layout>
      <AuthGate>
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
      </AuthGate>
    </Layout>
  );
});

export default RootLayout;
