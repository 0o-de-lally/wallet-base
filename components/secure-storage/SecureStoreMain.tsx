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
import { PinInputModal } from "../pin-input/PinInputModal";
import { styles } from "../../styles/styles";
import ConfirmationModal from "../modal/ConfirmationModal";

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
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
    // Modal states
    errorModalVisible,
    setErrorModalVisible,
    errorMessage,
    successModalVisible,
    setSuccessModalVisible,
    successMessage,
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

          {/* PIN Input Modal */}
          <PinInputModal
            visible={pinModalVisible}
            onClose={() => setPinModalVisible(false)}
            onPinVerified={handlePinVerified}
            purpose={currentAction || "retrieve"}
          />

          {/* Error Modal */}
          <ConfirmationModal
            visible={errorModalVisible}
            title="Error"
            message={errorMessage}
            confirmText="OK"
            onConfirm={() => setErrorModalVisible(false)}
            onCancel={() => setErrorModalVisible(false)}
          />

          {/* Success Modal */}
          <ConfirmationModal
            visible={successModalVisible}
            title="Success"
            message={successMessage}
            confirmText="OK"
            onConfirm={() => setSuccessModalVisible(false)}
            onCancel={() => setSuccessModalVisible(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
