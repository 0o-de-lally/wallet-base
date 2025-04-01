import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { saveValue, getValue } from "../../util/secure_store";
import {
  hashPin,
  validatePin,
  comparePins,
  HashedPin,
} from "../../util/pin_security";
import { styles } from "../../styles/styles";

/**
 * Screen component for PIN creation and verification.
 * Allows users to create a new PIN, update an existing PIN, and verify their PIN.
 */
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

  /**
   * Checks if a PIN already exists in secure storage.
   * Updates the hasSavedPin state based on the result.
   */
  const checkExistingPin = async () => {
    try {
      const savedPin = await getValue("user_pin");
      setHasSavedPin(savedPin !== null);
    } catch (error) {
      console.error("Error checking existing PIN:", error);
    }
  };

  /**
   * Handles the saving of a new PIN or updating an existing one.
   * Validates the PIN format, hashes it, and stores it in secure storage.
   */
  const handleSavePin = async () => {
    if (!validatePin(newPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      return;
    }

    try {
      setIsLoading(true);
      // Hash the PIN with salt before saving
      const hashedPin = await hashPin(newPin);
      // Properly serialize the HashedPin object to JSON
      await saveValue("user_pin", JSON.stringify(hashedPin));

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

  /**
   * Verifies if the entered PIN matches the stored PIN.
   * Retrieves the stored PIN, hashes the test PIN, and compares them.
   */
  const handleVerifyPin = async () => {
    if (!validatePin(testPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      return;
    }

    try {
      setIsLoading(true);
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        Alert.alert("Error", "No PIN is saved yet");
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, testPin);

      if (isPinValid) {
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
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={handleSavePin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading
              ? "Processing..."
              : hasSavedPin
                ? "Update PIN"
                : "Save PIN"}
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
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleVerifyPin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Verifying..." : "Verify PIN"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
