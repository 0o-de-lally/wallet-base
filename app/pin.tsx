import React, { memo } from "react";
import { View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-input/PinManagement";
import { SetupGuard } from "../components/auth/SetupGuard";
import { Stack } from "expo-router";

const PinScreen = observer(() => {
  return (
    <SetupGuard requiresPin={false} requiresAccount={false}>
      <View style={styles.root}>
        <Stack.Screen
          options={{
            title: "PIN Management",
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
