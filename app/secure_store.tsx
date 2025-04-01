import React from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useSecureStorage } from "../hooks/useSecureStorage";
import { SecureStorageForm } from "../components/secure-storage/SecureStorageForm";
import { SecureStorageResult } from "../components/secure-storage/SecureStorageResult";
import { PinInputModal } from "../components/pin-input/PinInputModal";
import { styles } from "../components/secure-storage/styles";

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
    handleClearAll,  // Get the handleClearAll method
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction
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
            Enter private information to be encrypted and stored securely with PIN protection.
            All data is stored under a single private key.
          </Text>

          <SecureStorageForm
            value={value}
            onValueChange={setValue}
            onSave={handleSave}
            onRetrieve={handleRetrieve}
            onDelete={handleDelete}
            onClearAll={handleClearAll}  // Pass the method here
            isLoading={isLoading}
          />

          <SecureStorageResult storedValue={storedValue} />

          {/* PIN Input Modal */}
          <PinInputModal
            visible={pinModalVisible}
            onClose={() => setPinModalVisible(false)}
            onPinVerified={handlePinVerified}
            purpose={currentAction || 'retrieve'}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
