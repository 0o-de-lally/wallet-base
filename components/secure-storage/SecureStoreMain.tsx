import React from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { SecureStorageForm } from "./SecureStorageForm";
import { PinInputModal } from "../pin-input/PinInputModal";
import { styles } from "../../styles/styles";

/**
 * Demo screen component for secure storage operations.
 * Allows saving, retrieving, and deleting encrypted values from secure storage.
 * Values are encrypted using the user's PIN and stored under a fixed key.
 */
export default function SecureStorageScreen() {
  const {
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleScheduleReveal,
    handleExecuteReveal,
    handleCancelReveal,
    handleDelete,
    handleClearAll,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
    revealStatus,
    clearRevealedValue,  // Get the clearRevealedValue function
  } = useSecureStorage();

  // Get purpose for pin modal
  const getPinPurpose = () => {
    switch (currentAction) {
      case "save": return "save";
      case "schedule_reveal": return "schedule_reveal";
      case "execute_reveal": return "execute_reveal";
      case "delete": return "delete";
      default: return "retrieve";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>PIN-Protected Storage</Text>

          <Text style={styles.description}>
            Enter private information to be encrypted and stored securely with
            PIN protection. All data is stored under a single private key.
            To reveal data, you must first schedule a reveal and wait 30 seconds.
            Revealed values will automatically hide after 30 seconds.
          </Text>

          <SecureStorageForm
            value={value}
            onValueChange={setValue}
            onSave={handleSave}
            onRetrieve={handleScheduleReveal}
            onScheduleReveal={handleScheduleReveal}
            onExecuteReveal={handleExecuteReveal}
            onCancelReveal={handleCancelReveal}
            onDelete={handleDelete}
            onClearAll={handleClearAll}
            isLoading={isLoading}
            revealStatus={revealStatus}
            storedValue={storedValue}
            onClearRevealedValue={clearRevealedValue}  // Pass the clear function
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
