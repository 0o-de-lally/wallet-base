import React, { useCallback } from "react";
import { View, StatusBar, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import RecoverAccountForm from "../components/profile/RecoverAccountForm";
import { SetupGuard } from "../components/auth/SetupGuard";
import { getLibraClient } from "../util/libra-client";
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
            title: "Recover Account",
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Recover Account</Text>
        <Text style={styles.description}>
          Restore an account from your 24-word recovery phrase. The account will
          be added to your wallet and you can assign a nickname to it.
        </Text>

        <RecoverAccountForm 
          onComplete={handleComplete} 
          libraClient={getLibraClient()} 
        />
      </View>
    </ScrollView>
  );
};
