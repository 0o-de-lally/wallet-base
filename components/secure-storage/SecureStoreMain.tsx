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
 * Focuses only on storing and deleting encrypted values.
 * Revealing is handled separately in the RevealScreen.
 */
export default function SecureStorageScreen() {
  const {
    value,
    setValue,
    isLoading,
    handleSave,
    handleDelete,
    handleClearAll,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
  } = useSecureStorage();

  // Get purpose for pin modal
  const getPinPurpose = () => {
    switch (currentAction) {
      case "save":
        return "save";
      case "delete":
        return "delete";
      default:
        return "save";
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
            PIN protection. All data is stored under a single private key. Use
            the Reveal Screen to access your stored data with additional
            security steps.
          </Text>

          <SecureStorageForm
            value={value}
            onValueChange={setValue}
            onSave={handleSave}
            onDelete={handleDelete}
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
