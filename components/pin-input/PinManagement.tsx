import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { getValue } from "../../util/secure-store";
import { verifyStoredPin } from "../../util/pin-security";
import { styles } from "../../styles/styles";
import { useModal } from "../../context/ModalContext";
import ConfirmationModal from "../modal/ConfirmationModal";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { PinInputModal } from "./PinInputModal";
import { PinCreationFlow } from "./PinCreationFlow";

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
  const [pinCreationVisible, setPinCreationVisible] = useState(false);

  // Current operation and temporary PIN storage for rotation flow
  const [currentOperation, setCurrentOperation] = useState<
    "verify" | "rotate" | "create" | null
  >(null);
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

          // Close the verification modal and show PIN creation flow
          setPinModalVisible(false);
          setPinCreationVisible(true);
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
   * Handles completion of PIN creation/rotation
   */
  const handlePinCreationComplete = useCallback(
    async (success: boolean) => {
      setPinCreationVisible(false);

      if (success) {
        // If this was a rotation, re-encrypt all secure data
        if (currentOperation === "rotate" && oldPin) {
          try {
            // Get the newly created PIN to re-encrypt data
            const savedPin = await getValue("user_pin");
            if (savedPin) {
              showAlert(
                "Success",
                "PIN updated successfully. Please note that existing encrypted data may need to be re-encrypted manually.",
              );
            }
          } catch (error) {
            showAlert(
              "Warning",
              "PIN updated but there was an issue with data re-encryption",
            );
            console.error(error);
          }
        }

        // Update pin exists state
        setPinExists(true);

        // Reset the operation
        setCurrentOperation(null);
        setOldPin(null);
      } else {
        // On failure, reset operation
        setCurrentOperation(null);
        setOldPin(null);
      }
    },
    [currentOperation, oldPin, showAlert],
  );

  /**
   * Handles PIN creation flow cancellation
   */
  const handlePinCreationCancel = useCallback(() => {
    setPinCreationVisible(false);
    setCurrentOperation(null);
    setOldPin(null);
  }, []);

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
    setPinCreationVisible(true);
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

      {/* PIN Creation Flow */}
      <PinCreationFlow
        visible={pinCreationVisible}
        onComplete={handlePinCreationComplete}
        onCancel={handlePinCreationCancel}
        showSuccessAlert={currentOperation !== "rotate"}
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
