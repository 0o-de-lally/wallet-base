import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { saveValue, getValue } from "../../util/secure-store";
import {
  hashPin,
  validatePin,
  verifyStoredPin,
  secureEncryptWithPin,
  secureDecryptWithPin,
} from "../../util/pin-security";
import { styles } from "../../styles/styles";
import { useModal } from "../../context/ModalContext";
import ConfirmationModal from "../modal/ConfirmationModal";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { PinInputModal } from "./PinInputModal";

/**
 * Screen component for PIN creation and verification.
 * Allows users to create a new PIN, update an existing PIN, and verify their PIN.
 */
const EnterPinScreen = memo(() => {
  // State for PIN operations
  const [isLoading, setIsLoading] = useState(false);
  const [pinExists, setPinExists] = useState(false);

  // Modal visibility states
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [rotatePinModalVisible, setRotatePinModalVisible] = useState(false);
  const [newPinModalVisible, setNewPinModalVisible] = useState(false);
  const [confirmPinModalVisible, setConfirmPinModalVisible] = useState(false);

  // Current operation and temporary PIN storage for rotation flow
  const [currentOperation, setCurrentOperation] = useState<
    "verify" | "rotate" | "create" | "confirm" | null
  >(null);
  const [tempNewPin, setTempNewPin] = useState<string | null>(null);
  const [oldPin, setOldPin] = useState<string | null>(null);

  const { showAlert } = useModal();

  // Check if PIN exists on component mount
  useEffect(() => {
    checkExistingPin();
  }, []);

  /**
   * Checks if a PIN already exists in secure storage.
   */
  const checkExistingPin = useCallback(async () => {
    try {
      const savedPin = await getValue("user_pin");
      setPinExists(savedPin !== null);
    } catch (error) {
      console.error("Error checking existing PIN:", error);
    }
  }, []);

  /**
   * Handles PIN verification when the user wants to test their PIN
   */
  const handleVerifyPin = useCallback(
    async (pin: string): Promise<void> => {
      setIsLoading(true);

      try {
        const isValid = await verifyStoredPin(pin);

        if (isValid) {
          showAlert("Success", "PIN verified successfully");
        } else {
          showAlert("Incorrect PIN", "The PIN you entered is incorrect");
        }
      } catch (error) {
        showAlert("Error", "Failed to verify PIN");
        console.error(error);
      } finally {
        setIsLoading(false);
        setPinModalVisible(false);
      }
    },
    [showAlert],
  );

  /**
   * Initiates the PIN rotation process by first verifying the old PIN
   */
  const handleOldPinVerified = useCallback(
    async (oldPinValue: string): Promise<void> => {
      setIsLoading(true);

      try {
        const isValid = await verifyStoredPin(oldPinValue);

        if (isValid) {
          // Store the old PIN for re-encryption later
          setOldPin(oldPinValue);

          // Close the verification modal and show the new PIN modal
          setPinModalVisible(false);
          setNewPinModalVisible(true);
        } else {
          showAlert("Incorrect PIN", "The PIN you entered is incorrect");
        }
      } catch (error) {
        showAlert("Error", "Failed to verify PIN");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [showAlert],
  );

  /**
   * Handles new PIN creation during the first step of PIN setup or rotation
   */
  const handleNewPin = useCallback(
    async (pin: string): Promise<void> => {
      if (!validatePin(pin)) {
        showAlert("Invalid PIN", "PIN must be exactly 6 digits");
        return;
      }

      // Store the new PIN temporarily
      setTempNewPin(pin);

      // Close the new PIN modal and show the confirmation modal
      setNewPinModalVisible(false);
      setConfirmPinModalVisible(true);
    },
    [showAlert],
  );

  /**
   * Handles PIN confirmation during the second step of PIN setup or rotation
   */
  const handleConfirmPin = useCallback(
    async (confirmPin: string): Promise<void> => {
      setIsLoading(true);

      if (!validatePin(confirmPin)) {
        showAlert("Invalid PIN", "PIN must be exactly 6 digits");
        setIsLoading(false);
        return;
      }

      if (confirmPin !== tempNewPin) {
        showAlert("PIN Mismatch", "PINs do not match. Please try again.");
        setIsLoading(false);
        return;
      }

      try {
        // Hash and save the new PIN
        const hashedPin = await hashPin(confirmPin);

        // Save the hashed PIN
        await saveValue("user_pin", JSON.stringify(hashedPin));

        // If this was a rotation, re-encrypt all secure data
        if (currentOperation === "rotate" && oldPin) {
          await reEncryptAllSecrets(oldPin, confirmPin);
          showAlert(
            "Success",
            "PIN updated and data re-encrypted successfully",
          );
        } else {
          showAlert("Success", "PIN saved successfully");
        }

        // Update pin exists state
        setPinExists(true);

        // Reset the operation and temp PIN
        setCurrentOperation(null);
        setTempNewPin(null);
        setOldPin(null);

        // Close all modals
        setConfirmPinModalVisible(false);
      } catch (error) {
        showAlert("Error", "Failed to save PIN");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentOperation, tempNewPin, oldPin, showAlert],
  );

  /**
   * Re-encrypts all secure data with a new PIN
   */
  const reEncryptAllSecrets = async (oldPin: string, newPin: string) => {
    try {
      setIsLoading(true);

      // Get all keys that might contain encrypted data
      const allKeys = ["default", "private_key"]; // Add more keys as needed

      for (const key of allKeys) {
        const encryptedBase64 = await getValue(key);

        if (encryptedBase64) {
          // Decrypt with old PIN
          const decryptResult = await secureDecryptWithPin(
            encryptedBase64,
            oldPin,
          );

          if (decryptResult && decryptResult.verified) {
            // Encrypt with new PIN
            const newEncryptedBase64 = await secureEncryptWithPin(
              decryptResult.value,
              newPin,
            );

            // Save re-encrypted data
            await saveValue(key, newEncryptedBase64);
          }
        }
      }

      // Also handle account-specific keys if needed
      // This would require checking the accounts or having a list of account IDs

      showAlert("Success", "All secrets re-encrypted with new PIN");
    } catch (error) {
      showAlert("Error", "Failed to re-encrypt secrets");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates the PIN verification process
   */
  const startVerifyPin = useCallback(() => {
    setCurrentOperation("verify");
    setPinModalVisible(true);
  }, []);

  /**
   * Initiates the PIN rotation process
   */
  const startRotatePin = useCallback(() => {
    setRotatePinModalVisible(true);
  }, []);

  /**
   * Confirms PIN rotation after warning dialog
   */
  const confirmRotatePin = useCallback(() => {
    setRotatePinModalVisible(false);
    setCurrentOperation("rotate");
    setPinModalVisible(true);
  }, []);

  /**
   * Initiates the PIN creation process
   */
  const startCreatePin = useCallback(() => {
    setCurrentOperation("create");
    setNewPinModalVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PIN Management</Text>

      {!pinExists ? (
        <SectionContainer title="Create PIN">
          <ActionButton
            text="Create New PIN"
            onPress={startCreatePin}
            accessibilityHint="Create a new PIN for secure access"
          />
        </SectionContainer>
      ) : (
        <SectionContainer title="PIN Operations">
          <View style={styles.buttonContainer}>
            <ActionButton
              text="Verify PIN"
              onPress={startVerifyPin}
              disabled={isLoading}
              accessibilityHint="Verify your PIN is correct"
            />
            <ActionButton
              text="Rotate PIN"
              onPress={startRotatePin}
              disabled={isLoading}
              accessibilityHint="Change your PIN"
            />
          </View>
        </SectionContainer>
      )}

      {/* PIN Input Modals */}
      <PinInputModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onPinAction={
          currentOperation === "rotate" ? handleOldPinVerified : handleVerifyPin
        }
        purpose={currentOperation === "rotate" ? "retrieve" : "retrieve"}
        actionTitle={
          currentOperation === "rotate" ? "Verify Current PIN" : "Verify PIN"
        }
        actionSubtitle={
          currentOperation === "rotate"
            ? "Enter your current PIN to begin the PIN change process"
            : "Enter your PIN to verify it's correct"
        }
      />

      <PinInputModal
        visible={newPinModalVisible}
        onClose={() => setNewPinModalVisible(false)}
        onPinAction={handleNewPin}
        purpose="save"
        actionTitle="Create New PIN"
        actionSubtitle={
          currentOperation === "rotate"
            ? "Enter your new PIN to replace the current one"
            : "Create a new PIN for secure access to your data"
        }
      />

      <PinInputModal
        visible={confirmPinModalVisible}
        onClose={() => setConfirmPinModalVisible(false)}
        onPinAction={handleConfirmPin}
        purpose="save"
        actionTitle="Confirm PIN"
        actionSubtitle="Enter your PIN again to confirm"
      />

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
