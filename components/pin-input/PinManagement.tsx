import React, { useRef, useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { saveValue, getValue } from "../../util/secure-store";
import {
  hashPin,
  validatePin,
  comparePins,
  HashedPin,
} from "../../util/pin-security";
import { styles } from "../../styles/styles";

/**
 * Screen component for PIN creation and verification.
 * Allows users to create a new PIN, update an existing PIN, and verify their PIN.
 */
export default function EnterPinScreen() {
  // Refs for PIN input
  const newPinRef = useRef("");
  const testPinRef = useRef("");
  const [hasSavedPin, setHasSavedPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
   *
   * Note: PIN hashing is handled by pin_security.ts, not crypto.ts
   */
  const handleSavePin = async () => {
    setIsLoading(true);

    const newPin = newPinRef.current;
    if (!validatePin(newPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      setIsLoading(false);
      return;
    }

    try {
      // Hash the PIN with salt before saving
      const hashedPin = await hashPin(newPin);

      // Properly serialize the HashedPin object to JSON
      await saveValue("user_pin", JSON.stringify(hashedPin));

      Alert.alert("Success", "PIN saved successfully");
      newPinRef.current = ""; // clear immediately after saving
      setHasSavedPin(true);
      setIsLoading(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save PIN");
      console.error(error);
      setIsLoading(false);
    }
  };

  /**
   * Verifies if the entered PIN matches the stored PIN.
   * Retrieves the stored PIN, hashes the test PIN, and compares them.
   */
  const handleVerifyPin = async () => {
    setIsVerifying(true);
    const testedPin = testPinRef.current;
    if (!validatePin(testedPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      return;
    }

    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        Alert.alert("Error", "No PIN is saved yet");
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      setIsVerifying(true);
      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, testedPin);
      setIsVerifying(false);

      if (isPinValid) {
        Alert.alert("Success", "PIN verified successfully");
      } else {
        Alert.alert("Incorrect PIN", "The PIN you entered is incorrect");
      }

      testPinRef.current = ""; // clear immediately after verifying
    } catch (error) {
      Alert.alert("Error", "Failed to verify PIN");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
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
            onChangeText={(text) => (newPinRef.current = text)}
            placeholderTextColor={styles.inputPlaceholder.color}
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
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {hasSavedPin ? "Update PIN" : "Save PIN"}
            </Text>
          )}
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
              onChangeText={(text) => (testPinRef.current = text)}
              placeholder="Enter your PIN"
              placeholderTextColor={styles.inputPlaceholder.color}
              keyboardType="number-pad"
              secureTextEntry={true}
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isVerifying && styles.disabledButton]}
            onPress={handleVerifyPin}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify PIN</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
