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
import { styles } from "../components/secure-storage/styles";

/**
 * Demo screen component for secure storage operations.
 * Allows saving, retrieving, and deleting values from secure storage.
 */
export default function SecureStorageScreen() {
  const {
    key,
    setKey,
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleRetrieve,
    handleDelete
  } = useSecureStorage();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Secure Storage Demo</Text>

          <SecureStorageForm
            key={key}
            value={value}
            onKeyChange={setKey}
            onValueChange={setValue}
            onSave={handleSave}
            onRetrieve={handleRetrieve}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          <SecureStorageResult storedValue={storedValue} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
