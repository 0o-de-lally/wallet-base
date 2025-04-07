import React, { useRef, useCallback } from "react";
import { View, StatusBar, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import { ModalProvider } from "../context/ModalContext";
import AddAccountForm from "../components/profile/AddAccountForm";
import type { AddAccountFormRef } from "../components/profile/AddAccountForm";
import { router } from "expo-router";
import { appConfig } from "../util/app-config-store";

/**
 * Create Account Screen
 *
 * This route displays the form to create a new account within an existing profile.
 */
export default function CreateAccountScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Create New Account",
          headerBackTitle: "Back",
        }}
      />
      <ModalProvider>
        <View style={styles.root}>
          <StatusBar backgroundColor={styles.root.backgroundColor} />
          <CreateAccountContent />
        </View>
      </ModalProvider>
    </>
  );
}

// Separate component that handles form logic
const CreateAccountContent = () => {
  // Use default profile or first available profile
  const profileNames = Object.keys(appConfig.profiles);
  const defaultProfileName =
    profileNames.length > 0 ? profileNames[0] : "default";

  const formRef = useRef<AddAccountFormRef>(null);

  const handleComplete = useCallback(() => {
    // Navigate back after successful account creation
    router.back();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Account</Text>
        <Text style={styles.description}>
          Add a new account to your wallet. You'll need to provide an account
          address and optionally assign a nickname to it.
        </Text>

        <AddAccountForm
          profileName={defaultProfileName}
          onComplete={handleComplete}
          ref={formRef}
        />
      </View>
    </ScrollView>
  );
};
