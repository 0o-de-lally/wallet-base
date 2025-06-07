import React, { useEffect, useCallback } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { observer } from "@legendapp/state/react";
import { Stack, useRouter } from "expo-router";
import { styles } from "../styles/styles";
import { initializeApp } from "@/util/initialize-app";

// Main App component that combines the functionality
export default function App() {
  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: "Back",
        }}
      />
      <AppContent />
    </View>
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

  const navigateToCreateAccount = useCallback(() => {
    router.navigate("/create-account");
  }, [router]);

  const navigateToRecoverAccount = useCallback(() => {
    router.navigate("/recover-account");
  }, [router]);

  const navigateToLibraTest = useCallback(() => {
    router.navigate("/libra-test");
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
    <View style={styles.root}>
      <View style={styles.container}>
        {renderNavigationButton("PIN Management", navigateToPIN)}
        {renderNavigationButton("Profile Management", navigateToProfiles)}
        {renderNavigationButton("Create Account", navigateToCreateAccount)}
        {renderNavigationButton("Recover Account", navigateToRecoverAccount)}
        {renderNavigationButton("Libra SDK Test", navigateToLibraTest)}
      </View>
    </View>
  );
});
