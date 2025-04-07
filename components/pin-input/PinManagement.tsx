import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { View, Text, TextInput } from "react-native";
import { saveValue, getValue } from "../../util/secure-store";
import {
  hashPin,
  validatePin,
  comparePins,
  HashedPin,
} from "../../util/pin-security";
import { styles } from "../../styles/styles";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { useModal } from "../../context/ModalContext";
import ConfirmationModal from "../modal/ConfirmationModal";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { PinInputField } from "./PinInputField";

/**
 * Screen component for PIN creation and verification.
 * Allows users to create a new PIN, update an existing PIN, and verify their PIN.
 */
const EnterPinScreen = memo(() => {
  // State for PIN inputs
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [testPin, setTestPin] = useState("");
  const [oldPinInput, setOldPinInput] = useState("");

  // Refs for TextInputs to maintain focus
  const newPinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);
  const testPinRef = useRef<TextInput>(null);

  // Use a separate string ref for storing the old PIN
  const oldPinValueRef = useRef<string>("");

  // TextInput ref for focus management
  const oldPinInputRef = useRef<TextInput>(null);

  const { reEncryptSecrets } = useSecureStorage();
  const { showAlert } = useModal();

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Modal visibility state
  const [rotatePinModalVisible, setRotatePinModalVisible] = useState(false);

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
   * Updates stage based on the result.
   */
  const checkExistingPin = useCallback(async () => {
    try {
      const savedPin = await getValue("user_pin");
      setStage(savedPin !== null ? "verify" : "newPin");
    } catch (error) {
      console.error("Error checking existing PIN:", error);
    }
  }, []);

  /**
   * Handles saving of a new PIN or updating an existing one.
   */
  const handleSavePin = useCallback(async () => {
    setIsLoading(true);

    if (!validatePin(newPin) || !validatePin(confirmPin)) {
      showAlert("Invalid PIN", "PIN must be exactly 6 digits");
      setIsLoading(false);
      return;
    }

    if (newPin !== confirmPin) {
      showAlert("PIN Mismatch", "PINs do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      // Hash the PIN with salt before saving
      const hashedPin = await hashPin(newPin);

      // Properly serialize the HashedPin object to JSON
      await saveValue("user_pin", JSON.stringify(hashedPin));

      showAlert("Success", "PIN saved successfully", () => {
        // Re-encrypt secrets if rotating PIN
        if (stage === "confirmPin") {
          reEncryptSecrets(newPin);
        }

        setNewPin(""); // clear immediately after saving
        setConfirmPin("");
        setStage("verify"); // go to verify stage
      });
    } catch (error) {
      showAlert("Error", "Failed to save PIN");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, stage, reEncryptSecrets, newPin, confirmPin]);

  const handleRotatePin = useCallback(() => {
    setRotatePinModalVisible(true);
  }, []);

  const confirmRotatePin = useCallback(() => {
    setRotatePinModalVisible(false);
    setStage("rotateOldPin");
  }, []);

  const handleVerifyOldPin = useCallback(async () => {
    setIsVerifying(true);

    if (!validatePin(oldPinInput)) {
      showAlert("Invalid PIN", "PIN must be exactly 6 digits");
      setIsVerifying(false);
      return;
    }

    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        showAlert("Error", "No PIN is saved yet");
        setIsVerifying(false);
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, oldPinInput);

      if (isPinValid) {
        showAlert("Success", "Old PIN verified successfully", () => {
          // Store the old PIN in the mutable ref
          oldPinValueRef.current = oldPinInput;
          setOldPinInput(""); // Clear the old PIN input
          setStage("newPin"); // Proceed to new PIN creation
        });
      } else {
        showAlert("Incorrect PIN", "The PIN you entered is incorrect");
      }
    } catch (error) {
      showAlert("Error", "Failed to verify PIN");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  }, [showAlert, oldPinInput]);

  const handleVerifyPin = useCallback(async () => {
    setIsVerifying(true);

    if (!validatePin(testPin)) {
      showAlert("Invalid PIN", "PIN must be exactly 6 digits");
      setIsVerifying(false);
      return;
    }

    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        showAlert("Error", "No PIN is saved yet");
        setIsVerifying(false);
        return;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Use the comparePins function to properly compare PINs
      const isPinValid = await comparePins(storedHashedPin, testPin);

      if (isPinValid) {
        showAlert("Success", "PIN verified successfully");
      } else {
        showAlert("Incorrect PIN", "The PIN you entered is incorrect");
      }

      setTestPin(""); // clear immediately after verifying
    } catch (error) {
      showAlert("Error", "Failed to verify PIN");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  }, [showAlert, testPin]);

  // Memoize state update functions to prevent unnecessary re-renders
  const handleNewPinChange = useCallback((text: string) => {
    setNewPin(text);
  }, []);

  const handleConfirmPinChange = useCallback((text: string) => {
    setConfirmPin(text);
  }, []);

  const handleTestPinChange = useCallback((text: string) => {
    setTestPin(text);
  }, []);

  const handleOldPinChange = useCallback((text: string) => {
    setOldPinInput(text);
  }, []);

  const renderStageContent = useCallback(() => {
    switch (stage) {
      case "newPin":
        return (
          <SectionContainer title="Create New PIN">
            <PinInputField
              label="Enter 6-digit PIN:"
              value={newPin}
              onChangeText={handleNewPinChange}
              placeholder="Enter 6-digit PIN"
              onSubmit={() => setStage("confirmPin")}
              autoFocus={true}
              ref={newPinRef}
            />
            <ActionButton
              text="Next"
              onPress={() => setStage("confirmPin")}
              accessibilityHint="Proceed to confirm your PIN"
            />
          </SectionContainer>
        );
      case "confirmPin":
        return (
          <SectionContainer title="Confirm New PIN">
            <PinInputField
              label="Confirm 6-digit PIN:"
              value={confirmPin}
              onChangeText={handleConfirmPinChange}
              placeholder="Confirm 6-digit PIN"
              onSubmit={handleSavePin}
              autoFocus={true}
              ref={confirmPinRef}
            />
            <ActionButton
              text="Save PIN"
              onPress={handleSavePin}
              isLoading={isLoading}
              disabled={isLoading}
              accessibilityHint="Saves your PIN securely"
            />
          </SectionContainer>
        );
      case "verify":
        return (
          <SectionContainer title="Verify PIN">
            <PinInputField
              label="Enter your PIN:"
              value={testPin}
              onChangeText={handleTestPinChange}
              placeholder="Enter your PIN"
              onSubmit={handleVerifyPin}
              clearOnSubmit={true}
              ref={testPinRef}
            />
            <View style={styles.buttonContainer}>
              <ActionButton
                text="Verify PIN"
                onPress={handleVerifyPin}
                isLoading={isVerifying}
                disabled={isVerifying}
                accessibilityHint="Verify your PIN is correct"
              />
              <ActionButton
                text="Rotate PIN"
                onPress={handleRotatePin}
                disabled={isVerifying}
                accessibilityHint="Change your PIN"
              />
            </View>
          </SectionContainer>
        );
      case "rotateOldPin":
        return (
          <SectionContainer title="Verify Old PIN">
            <PinInputField
              label="Enter your old PIN:"
              value={oldPinInput}
              onChangeText={handleOldPinChange}
              placeholder="Enter your old PIN"
              onSubmit={handleVerifyOldPin}
              clearOnSubmit={true}
              ref={oldPinInputRef}
            />
            <ActionButton
              text="Verify Old PIN"
              onPress={handleVerifyOldPin}
              isLoading={isVerifying}
              disabled={isVerifying}
              accessibilityHint="Verify your existing PIN before changing it"
            />
          </SectionContainer>
        );
      default:
        return null;
    }
  }, [
    stage,
    isLoading,
    isVerifying,
    newPin,
    confirmPin,
    testPin,
    oldPinInput,
    handleNewPinChange,
    handleConfirmPinChange,
    handleTestPinChange,
    handleOldPinChange,
    handleSavePin,
    handleVerifyPin,
    handleRotatePin,
    handleVerifyOldPin,
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PIN Management</Text>
      {renderStageContent()}

      {/* Confirmation Modal for PIN Rotation */}
      <ConfirmationModal
        visible={rotatePinModalVisible}
        title="Rotate PIN"
        message="You are about to change your PIN. This will require re-encrypting all your secure data. Continue?"
        confirmText="Continue"
        onConfirm={confirmRotatePin}
        onCancel={() => setRotatePinModalVisible(false)}
      />
    </View>
  );
});

EnterPinScreen.displayName = "EnterPinScreen";

export default EnterPinScreen;
