import React, { memo } from "react";
import { View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-management/PinManagementContainer";
import { SetupGuard } from "../components/auth/SetupGuard";
import { Stack } from "expo-router";
import { useAuthenticationProtection } from "../hooks/use-screenshot-protection";

const PinScreen = observer(() => {
  // Authentication protection - prevents screenshots in PIN management screen
  useAuthenticationProtection("PinScreen");

  return (
    <SetupGuard requiresPassword={false} requiresAccount={false}>
      <View style={styles.root}>
        <Stack.Screen
          options={{
            title: "Password Management",
            headerBackTitle: "Back",
          }}
        />
        <PinScreenContent />
      </View>
    </SetupGuard>
  );
});

const PinScreenContent = memo(() => {
  return (
    <>
      <EnterPinScreen />
      {/* DangerZone removed: clearing all app data is now in Settings */}
    </>
  );
});

PinScreenContent.displayName = "PinScreenContent";

export default PinScreen;
