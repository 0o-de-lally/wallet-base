import React, { useState } from "react";
import { StatusBar, View, Alert } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-input/PinManagement";
import { ModalProvider } from "../context/ModalContext";
import { DangerZone } from "../components/secure-storage/DangerZone";
import { clearAllSecureStorage } from "@/util/secure-store";

export default observer(function PinScreen() {
  return (
    <ModalProvider>
      <View style={[styles.root]}>
        <StatusBar backgroundColor={styles.root.backgroundColor} />
        <PinScreenContent />
      </View>
    </ModalProvider>
  );
});

function PinScreenContent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      await clearAllSecureStorage();
      Alert.alert("Success", "All secure data has been deleted.");
    } catch (error) {
      console.error("Error clearing all data:", error);
      Alert.alert("Error", "Failed to clear secure data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <EnterPinScreen />
      <DangerZone onClearAll={handleClearAll} isLoading={isLoading} />
    </>
  );
}
