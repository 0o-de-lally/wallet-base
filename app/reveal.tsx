import React from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ModalProvider } from "../context/ModalContext";
import { styles } from "../styles/styles";
import { useSecureStorage } from "../hooks/use-secure-storage";
import { RevealStatusUI } from "../components/reveal/RevealStatusUI";
import { PinInputModal } from "../components/pin-input/PinInputModal";
import { DangerZone } from "../components/secure-storage/DangerZone";

/**
 * Screen component dedicated to revealing secure storage.
 * Completely separate workflow from storing values.
 */
export default function RevealScreen() {
  return (
    <SafeAreaProvider>
      <ModalProvider>
        <RevealScreenContent />
      </ModalProvider>
    </SafeAreaProvider>
  );
}

// Separate component that uses hooks after providers are in place
function RevealScreenContent() {
  const {
    storedValue,
    isLoading,
    handleScheduleReveal,
    handleExecuteReveal,
    handleCancelReveal,
    clearRevealedValue,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
    revealStatus,
    handleClearAll,
  } = useSecureStorage();

  // Get purpose for pin modal
  const getPinPurpose = () => {
    switch (currentAction) {
      case "schedule_reveal":
        return "schedule_reveal";
      case "execute_reveal":
        return "execute_reveal";
      default:
        return "retrieve";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar backgroundColor={styles.root.backgroundColor} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Reveal Secure Data</Text>

          <Text style={styles.description}>
            This screen allows you to securely reveal your saved data. You must
            first schedule a reveal and wait 30 seconds before you can access
            the data. Once revealed, the data will automatically hide after 30
            seconds.
          </Text>

          <RevealStatusUI
            revealStatus={revealStatus}
            storedValue={storedValue}
            isLoading={isLoading}
            onScheduleReveal={handleScheduleReveal}
            onExecuteReveal={handleExecuteReveal}
            onCancelReveal={handleCancelReveal}
            onClearRevealedValue={clearRevealedValue}
          />

          {/* Add the DangerZone component */}
          <DangerZone
            onClearAll={handleClearAll}
            isLoading={isLoading}
          />

          {/* PIN Input Modal */}
          <PinInputModal
            visible={pinModalVisible}
            onClose={() => setPinModalVisible(false)}
            onPinVerified={handlePinVerified}
            purpose={getPinPurpose()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
