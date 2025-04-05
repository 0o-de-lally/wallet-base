import React, { useState, useEffect } from "react";
import {
  Text,
  View,
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
import { CustomPinInput } from "./CustomPinInput";

/**
 * Screen component for PIN creation and verification.
 * Allows users to create a new PIN, update an existing PIN, and verify their PIN.
 */
export default function EnterPinScreen() {
  const [hasSavedPin, setHasSavedPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState<"create" | "verify" | "update">("create");
  const [error, setError] = useState<string | null>(null);
  const [currentPin, setCurrentPin] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pinToConfirm, setPinToConfirm] = useState<string>("");

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
      const pinExists = savedPin !== null;
      setHasSavedPin(pinExists);
      setMode(pinExists ? "update" : "create");
    } catch (error) {
      console.error("Error checking existing PIN:", error);
    }
  };

  /**
   * Handles the saving of a new PIN.
   * Validates the PIN format and stores it in secure storage.
   */
  const handleSavePin = async () => {
    if (!currentPin) {
      setError("Please enter a PIN");
      return;
    }

    if (!validatePin(currentPin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    if (!showConfirmation) {
      // First entry - store for confirmation
      setPinToConfirm(currentPin);
      setShowConfirmation(true);
      setCurrentPin("");
      return;
    }

    // Check if confirmation matches
    if (currentPin !== pinToConfirm) {
      setError("PINs don't match. Please try again.");
      setPinToConfirm("");
      setShowConfirmation(false);
      setCurrentPin("");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Hash the PIN with salt before saving
      const hashedPin = await hashPin(currentPin);

      // Properly serialize the HashedPin object to JSON
      await saveValue("user_pin", JSON.stringify(hashedPin));

      Alert.alert("Success", "PIN saved successfully");
      setHasSavedPin(true);
      setMode("update");
      setShowConfirmation(false);
      setPinToConfirm("");
      setCurrentPin("");
    } catch (error) {
      setError("Failed to save PIN");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifies if the entered PIN matches the stored PIN.
   */
  const handleVerifyPin = async () => {
    if (!currentPin) {
      setError("Please enter a PIN");
      return;
    }

    setIsVerifying(true);
    setError(null);

    if (!validatePin(currentPin)) {
      setError("PIN must be exactly 6 digits");
      setIsVerifying(false);
      return;
    }

    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        setError("No PIN is saved yet");
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, currentPin);

      if (isPinValid) {
        Alert.alert("Success", "PIN verified successfully");
        setCurrentPin("");
      } else {
        setError("The PIN you entered is incorrect");
      }
    } catch (error) {
      setError("Failed to verify PIN");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const resetState = () => {
    setShowConfirmation(false);
    setPinToConfirm("");
    setCurrentPin("");
    setError(null);
  };

  const switchToVerify = () => {
    resetState();
    setMode("verify");
  };

  const switchToUpdate = () => {
    resetState();
    setMode("update");
  };

  const handlePinUpdate = (pin: string) => {
    setCurrentPin(pin);
    if (error) setError(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PIN Management</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {!hasSavedPin
            ? "Create PIN"
            : mode === "verify"
            ? "Verify PIN"
            : showConfirmation
            ? "Confirm New PIN"
            : "Change PIN"}
        </Text>

        {isLoading || isVerifying ? (
          <ActivityIndicator size="large" color="#94c2f3" />
        ) : (
          <>
            <CustomPinInput
              onPinComplete={handlePinUpdate}
              title={
                !hasSavedPin
                  ? showConfirmation
                    ? "Confirm your PIN"
                    : "Create a new PIN"
                  : mode === "verify"
                  ? "Enter your PIN"
                  : showConfirmation
                  ? "Confirm your new PIN"
                  : "Enter a new PIN"
              }
              subtitle={
                showConfirmation
                  ? "Please enter the same PIN again to confirm"
                  : mode === "verify"
                  ? "Enter your PIN to verify"
                  : "Please enter a 6-digit PIN"
              }
              error={error}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { marginTop: 24, width: "100%", maxWidth: 300 },
                currentPin.length !== 6 && { opacity: 0.6 },
              ]}
              onPress={mode === "verify" ? handleVerifyPin : handleSavePin}
              disabled={currentPin.length !== 6}
            >
              <Text style={styles.buttonText}>
                {mode === "verify"
                  ? "Verify PIN"
                  : showConfirmation
                  ? "Confirm PIN"
                  : hasSavedPin
                  ? "Update PIN"
                  : "Save PIN"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Action toggles for authenticated users */}
        {hasSavedPin && !isLoading && !isVerifying && (
          <View style={{ marginTop: 24 }}>
            {mode === "verify" ? (
              <TouchableOpacity
                style={[styles.button, { marginTop: 16 }]}
                onPress={switchToUpdate}
              >
                <Text style={styles.buttonText}>Change PIN Instead</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, { marginTop: 16 }]}
                onPress={switchToVerify}
              >
                <Text style={styles.buttonText}>Verify PIN Instead</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cancel confirmation if needed */}
        {showConfirmation && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { marginTop: 16, width: "100%", maxWidth: 300 },
            ]}
            onPress={resetState}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
