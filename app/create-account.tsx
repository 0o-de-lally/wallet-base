import React, { useCallback } from "react";
import { View, StatusBar, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import { AddAccountForm } from "../components/profile/AddAccountForm";
import { router } from "expo-router";

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
      <View style={styles.root}>
        <StatusBar backgroundColor={styles.root.backgroundColor} />
        <CreateAccountContent />
      </View>
    </>
  );
}

// Separate component that handles form logic
const CreateAccountContent = () => {
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

        <AddAccountForm onComplete={handleComplete} />
      </View>
    </ScrollView>
  );
};
