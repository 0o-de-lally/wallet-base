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
import { useSecureStorage } from "../../hooks/use-secure-storage";

/**
 * Screen component for PIN creation and verification.
 * Allows users to create a new PIN, update an existing PIN, and verify their PIN.
 */
export default function EnterPinScreen() {
  // Refs for PIN input
  const newPinRef = useRef("");
  const confirmPinRef = useRef("");
  const testPinRef = useRef("");

  const { reEncryptSecrets, oldPinRef } = useSecureStorage();

  const [hasSavedPin, setHasSavedPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // States to manage the different steps
  const [stage, setStage] = useState<
    "verify" | "newPin" | "confirmPin" | "rotateOldPin" | null
  >(null);

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
      setStage(savedPin !== null ? "verify" : "newPin"); // Set initial stage based on whether a PIN exists
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
    const confirmPin = confirmPinRef.current;

    if (!validatePin(newPin) || !validatePin(confirmPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      setIsLoading(false);
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("PIN Mismatch", "PINs do not match. Please try again.");
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
      confirmPinRef.current = "";

      // Re-encrypt secrets if rotating PIN
      if (stage === "confirmPin") {
        await reEncryptSecrets(newPin);
      }

      setHasSavedPin(true);
      setStage("verify"); // go to verify stage
      setIsLoading(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save PIN");
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleRotatePin = () => {
    setStage("rotateOldPin");
  };

  const handleVerifyOldPin = async () => {
    setIsVerifying(true);
    const oldPin = oldPinRef.current;
    if (!validatePin(oldPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 6 digits");
      setIsVerifying(false);
      return;
    }

    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        Alert.alert("Error", "No PIN is saved yet");
        setIsVerifying(false);
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, oldPin);

      if (isPinValid) {
        Alert.alert("Success", "Old PIN verified successfully");
        oldPinRef.current = oldPin; // Store the old PIN in the ref
        setStage("newPin"); // Proceed to new PIN creation
      } else {
        Alert.alert("Incorrect PIN", "The PIN you entered is incorrect");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify PIN");
      console.error(error);
    } finally {
      setIsVerifying(false);
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
      setIsVerifying(false);
      return;
    }

    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        Alert.alert("Error", "No PIN is saved yet");
        setIsVerifying(false);
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, testedPin);

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

  const renderStageContent = () => {
    switch (stage) {
      case "newPin":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create New PIN</Text>
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
              style={styles.button}
              onPress={() => setStage("confirmPin")}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case "confirmPin":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirm New PIN</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm 6-digit PIN:</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => (confirmPinRef.current = text)}
                placeholderTextColor={styles.inputPlaceholder.color}
                placeholder="Confirm 6-digit PIN"
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
                <Text style={styles.buttonText}>Save PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      case "verify":
        return (
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
            <TouchableOpacity style={styles.button} onPress={handleRotatePin}>
              <Text style={styles.buttonText}>Rotate PIN</Text>
            </TouchableOpacity>
          </View>
        );
      case "rotateOldPin":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verify Old PIN</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter your old PIN:</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => (oldPinRef.current = text)}
                placeholder="Enter your old PIN"
                placeholderTextColor={styles.inputPlaceholder.color}
                keyboardType="number-pad"
                secureTextEntry={true}
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, isVerifying && styles.disabledButton]}
              onPress={handleVerifyOldPin}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify Old PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PIN Management</Text>
      {renderStageContent()}
    </View>
  );
}
