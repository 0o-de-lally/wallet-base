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
import { SecureStorageResult } from "./SecureStorageResult";
import { PinInputOverlay } from "../pin-input/PinInputModal"; // Still using same file but different component
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
    handleRetrieve,
    handleDelete,
    handleClearAll,
    pinOverlayVisible, // renamed from pinModalVisible
    setPinOverlayVisible, // renamed from setPinModalVisible
    handlePinVerified,
    currentAction,
  } = useSecureStorage();

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
          </Text>

          <SecureStorageForm
            value={value}
            onValueChange={setValue}
            onSave={handleSave}
            onRetrieve={handleRetrieve}
            onDelete={handleDelete}
            onClearAll={handleClearAll}
            isLoading={isLoading}
          />

          <SecureStorageResult storedValue={storedValue} />

          {/* PIN Input Overlay */}
          <PinInputOverlay
            visible={pinOverlayVisible}
            onClose={() => setPinOverlayVisible(false)}
            onPinVerified={handlePinVerified}
            purpose={currentAction || "retrieve"}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
