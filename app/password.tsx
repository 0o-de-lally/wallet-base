import React, { memo } from "react";
import { View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPasswordScreen from "../components/pin-management/PinManagementContainer";
import { SetupGuard } from "../components/auth/SetupGuard";
import { Stack } from "expo-router";
import { useAuthenticationProtection } from "../hooks/use-screenshot-protection";

const PasswordScreen = observer(() => {
  // Authentication protection - prevents screenshots in Password management screen
  useAuthenticationProtection("PasswordScreen");

  return (
    <SetupGuard requiresPassword={false} requiresAccount={false}>
      <View style={styles.root}>
        <Stack.Screen
          options={{
            title: "Password Management",
            headerBackTitle: "Back",
          }}
        />
        <PasswordScreenContent />
      </View>
    </SetupGuard>
  );
});

const PasswordScreenContent = memo(() => {
  return (
    <>
      <EnterPasswordScreen />
      {/* DangerZone removed: clearing all app data is now in Settings */}
    </>
  );
});

PasswordScreenContent.displayName = "PasswordScreenContent";

export default PasswordScreen;
