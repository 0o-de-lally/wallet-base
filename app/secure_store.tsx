
import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { saveValue, getValue, deleteValue } from "../util/secure_store";

export default function SecureStorageScreen() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!key.trim() || !value.trim()) {
      Alert.alert("Error", "Both key and value are required");
      return;
    }

    try {
      setIsLoading(true);
      await saveValue(key, value);
      Alert.alert("Success", "Value saved securely");
      setValue("");
    } catch (error) {
      Alert.alert("Error", "Failed to save value");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!key.trim()) {
      Alert.alert("Error", "Key is required");
      return;
    }

    try {
      setIsLoading(true);
      const result = await getValue(key);
      setStoredValue(result);

      if (result === null) {
        Alert.alert("Info", "No value found for this key");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to retrieve value");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!key.trim()) {
      Alert.alert("Error", "Key is required");
      return;
    }

    try {
      setIsLoading(true);
      await deleteValue(key);
      setStoredValue(null);
      Alert.alert("Success", "Value deleted");
    } catch (error) {
      Alert.alert("Error", "Failed to delete value");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Secure Storage Demo</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Key:</Text>
            <TextInput
              style={styles.input}
              value={key}
              onChangeText={setKey}
              placeholder="Enter storage key"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Value:</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder="Enter value to store"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRetrieve}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Retrieve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleDelete}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          {storedValue !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Retrieved Value:</Text>
              <Text style={styles.resultValue}>{storedValue}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 16,
  },
});
