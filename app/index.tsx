import React, { useEffect, useCallback } from "react";
import { View, StatusBar, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SecureStorageScreen from "../components/secure-storage/SecureStoreMain";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { styles } from "../styles/styles";
import { ModalProvider } from "../context/ModalContext";
import { initializeApp } from "@/util/initialize-app";

// Main App component that combines the functionality
export default function App() {
  return (
    <SafeAreaProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </SafeAreaProvider>
  );
}

// Content component with observer for reactive updates
const AppContent = observer(() => {
  useEffect(() => {
    initializeApp();
  }, []);

  // Use the useRouter hook to get the router instance
  const router = useRouter();

  const navigateToPIN = useCallback(() => {
    router.navigate("/pin");
  }, [router]);

  const navigateToProfiles = useCallback(() => {
    router.navigate("/profiles");
  }, [router]);

  const navigateToReveal = useCallback(() => {
    router.navigate("/reveal");
  }, [router]);

  const navigateToCreateAccount = useCallback(() => {
    router.navigate("/create-account");
  }, [router]);

  const renderNavigationButton = useCallback(
    (text: string, onPress: () => void) => (
      <TouchableOpacity
        style={styles.navButton}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={text}
      >
        <Text style={styles.navButtonText}>{text}</Text>
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <>
      <StatusBar backgroundColor={styles.root.backgroundColor} />

      <View style={styles.root}>
        <View style={styles.container}>
          {renderNavigationButton("PIN Management", navigateToPIN)}
          {renderNavigationButton("Profile Management", navigateToProfiles)}
          {renderNavigationButton("Reveal Secure Data", navigateToReveal)}
          {renderNavigationButton("Create Account", navigateToCreateAccount)}
        </View>
        <View style={styles.container}>
          <SecureStorageScreen />
        </View>
      </View>
    </>
  );
});
