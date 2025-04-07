import React, { useRef, useCallback, useState, useEffect } from "react";
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
  // Get all available profiles
  const profileNames = Object.keys(appConfig.profiles.get());
  const [selectedProfile, setSelectedProfile] = useState(profileNames[0] || "default");
  const hasMultipleProfiles = profileNames.length > 1;

  const formRef = useRef<AddAccountFormRef>(null);

  // Update selected profile if profiles change
  useEffect(() => {
    if (profileNames.length > 0 && !profileNames.includes(selectedProfile)) {
      setSelectedProfile(profileNames[0]);
    }
  }, [profileNames, selectedProfile]);

  const handleComplete = useCallback(() => {
    // Navigate back after successful account creation
    router.back();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Account</Text>
        <Text style={styles.description}>
          Add a new account to your wallet. You&apos;ll need to provide an
          account address and optionally assign a nickname to it.
        </Text>

        <AddAccountForm
          profileName={selectedProfile}
          onComplete={handleComplete}
          ref={formRef}
        />
      </View>
    </ScrollView>
  );
};
