import React, { useCallback } from "react";
import { View, StatusBar, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import RecoverAccountForm from "../components/account-recovery/RecoverAccountForm";
import { SetupGuard } from "../components/auth/SetupGuard";
import { router } from "expo-router";

/**
 * Recover Account Screen
 *
 * This route displays the form to recover an account from a mnemonic phrase
 * within an existing profile.
 */
export default function RecoverAccountScreen() {
  return (
    <SetupGuard requiresPin={true} requiresAccount={false}>
      <View style={styles.root}>
        <Stack.Screen
          options={{
            title: "Add Account",
            headerBackTitle: "Back",
          }}
        />
        <StatusBar backgroundColor={styles.root.backgroundColor} />
        <RecoverAccountContent />
      </View>
    </SetupGuard>
  );
}

// Separate component that handles form logic
const RecoverAccountContent = () => {
  const handleComplete = useCallback(() => {
    // Navigate back after successful account recovery
    router.back();
  }, []);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <RecoverAccountForm onComplete={handleComplete} />
      </View>
    </ScrollView>
  );
};
