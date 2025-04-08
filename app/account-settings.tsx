import React, { memo } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { AccountSettings } from "../components/profile/AccountSettings";
import { styles } from "../styles/styles";

/**
 * Account Settings Screen
 *
 * This route handles displaying account settings for a specific account.
 * It receives accountId and profileName as parameters from the navigation.
 */
export default function AccountSettingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Account Settings",
          headerBackTitle: "Back",
        }}
      />
      <View style={styles.root}>
        <AccountSettingsContent />
      </View>
    </>
  );
}

// Separate component that handles params
const AccountSettingsContent = memo(() => {
  // Get route params using the Expo Router hook
  const params = useLocalSearchParams();
  const accountId = params.accountId as string;
  const profileName = params.profileName as string;

  return <AccountSettings accountId={accountId} profileName={profileName} />;
});

AccountSettingsContent.displayName = "AccountSettingsContent";
