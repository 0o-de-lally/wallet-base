import React, { useState, useEffect } from "react";
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
import { saveValue, getValue } from "../util/secure_store";
import { hashPin, validatePin } from "../util/security";

export default function EnterPinScreen() {
  // State variables
  const [newPin, setNewPin] = useState("");
  const [testPin, setTestPin] = useState("");
  const [hasSavedPin, setHasSavedPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if PIN exists on component mount
  useEffect(() => {
    checkExistingPin();
  }, []);

  // Function to check if PIN exists
  const checkExistingPin = async () => {
    try {
      const savedPin = await getValue("user_pin");
      setHasSavedPin(savedPin !== null);
    } catch (error) {
      console.error("Error checking existing PIN:", error);
    }
  };

  // Function to save a new PIN
  const handleSavePin = async () => {
    if (!validatePin(newPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      return;
    }

    try {
      setIsLoading(true);
      // Hash the PIN with salt before saving
      const hashedPin = hashPin(newPin);
      await saveValue("user_pin", hashedPin);

      Alert.alert("Success", "PIN saved successfully");
      setNewPin("");
      setHasSavedPin(true);
    } catch (error) {
      Alert.alert("Error", "Failed to save PIN");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify PIN
  const handleVerifyPin = async () => {
    if (!validatePin(testPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      return;
    }

    try {
      setIsLoading(true);
      const savedPin = await getValue("user_pin");

      if (!savedPin) {
        Alert.alert("Error", "No PIN is saved yet");
        return;
      }

      // Hash the test PIN and compare with saved PIN
      const hashedTestPin = hashPin(testPin);

      if (hashedTestPin === savedPin) {
        Alert.alert("Success", "PIN verified successfully");
      } else {
        Alert.alert("Incorrect PIN", "The PIN you entered is incorrect");
      }

      setTestPin("");
    } catch (error) {
      Alert.alert("Error", "Failed to verify PIN");
      console.error(error);
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
          <Text style={styles.title}>PIN Management</Text>

          {/* PIN Creation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {hasSavedPin ? "Change PIN" : "Create PIN"}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter 6-digit PIN:</Text>
              <TextInput
                style={styles.input}
                value={newPin}
                onChangeText={setNewPin}
                placeholder="Enter 6-digit PIN"
                keyboardType="number-pad"
                secureTextEntry={true}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSavePin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {hasSavedPin ? "Update PIN" : "Save PIN"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PIN Verification Section */}
          {hasSavedPin && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verify PIN</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter your PIN:</Text>
                <TextInput
                  style={styles.input}
                  value={testPin}
                  onChangeText={setTestPin}
                  placeholder="Enter your PIN"
                  keyboardType="number-pad"
                  secureTextEntry={true}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyPin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Verify PIN</Text>
              </TouchableOpacity>
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
  section: {
    marginBottom: 30,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
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
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
