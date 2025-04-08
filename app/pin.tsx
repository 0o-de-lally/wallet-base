import React, { useState, useCallback, memo } from "react";
import { View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-input/PinManagement";
import { useModal } from "../context/ModalContext";
import { DangerZone } from "../components/secure-storage/DangerZone";
import { clearAllSecureStorage } from "@/util/secure-store";
import { Stack } from "expo-router";

const PinScreen = observer(() => {
  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "PIN Management",
          headerBackTitle: "Back",
        }}
      />
      <PinScreenContent />
    </View>
  );
});

const PinScreenContent = memo(() => {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useModal();

  const handleClearAll = useCallback(async () => {
    try {
      setIsLoading(true);
      await clearAllSecureStorage();
      showAlert("Success", "All secure data has been deleted.");
    } catch (error) {
      console.error("Error clearing all data:", error);
      showAlert("Error", "Failed to clear secure data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  return (
    <>
      <EnterPinScreen />
      <DangerZone onClearAll={handleClearAll} isLoading={isLoading} />
    </>
  );
});

PinScreenContent.displayName = "PinScreenContent";

export default PinScreen;
