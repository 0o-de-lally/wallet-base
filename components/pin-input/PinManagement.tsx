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
import { PinRotationFlow } from "./PinRotationFlow";
import { PinRotationProgressModal } from "./PinRotationProgressModal";
import { 
  rotatePinAndReencryptData, 
  validateOldPinCanDecryptData,
  getAllAccountsWithStoredData,
  type PinRotationProgress,
} from "../../util/pin-rotation";

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
  const [pinRotationFlowVisible, setPinRotationFlowVisible] = useState(false);
  const [rotationProgressVisible, setRotationProgressVisible] = useState(false);

  // Current operation and temporary PIN storage for rotation flow
  const [currentOperation, setCurrentOperation] = useState<
    "verify" | "rotate" | "create" | null
  >(null);
  const [oldPin, setOldPin] = useState<string | null>(null);
  const [accountsWithData, setAccountsWithData] = useState<number>(0);
  const [rotationProgress, setRotationProgress] = useState<PinRotationProgress>(
    {
      total: 0,
      completed: 0,
      failed: [],
    },
  );

  const { showAlert } = useModal();

  // Check if PIN exists on component mount
  useEffect(() => {
    checkExistingPin();
    loadAccountsWithData();
  }, []);

  /**
   * Loads the count of accounts with stored encrypted data
   */
  const loadAccountsWithData = useCallback(async () => {
    try {
      const accounts = await getAllAccountsWithStoredData();
      setAccountsWithData(accounts.length);
    } catch (error) {
      console.error("Error loading accounts with data:", error);
    }
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

        if (!isValid) {
          showAlert("Incorrect PIN", "The PIN you entered is incorrect");
          setIsLoading(false);
          return;
        }

        // Additionally validate that the PIN can decrypt existing data
        if (accountsWithData > 0) {
          const validationResult =
            await validateOldPinCanDecryptData(oldPinValue);
          if (!validationResult.isValid) {
            showAlert(
              "PIN Validation Failed",
              `Cannot decrypt existing data with this PIN. ${validationResult.error || ""}`,
            );
            setIsLoading(false);
            return;
          }
        }

        // Store the old PIN for re-encryption later
        setOldPin(oldPinValue);

        // Close the verification modal and show PIN rotation flow
        setPinModalVisible(false);
        setPinRotationFlowVisible(true);
      } catch (error) {
        showAlert("Error", "Failed to verify PIN");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [showAlert, accountsWithData],
  );

  /**
   * Handles completion of PIN rotation flow
   */
  const handlePinRotationComplete = useCallback(
    async (success: boolean, newPin?: string) => {
      setPinRotationFlowVisible(false);

      if (success && oldPin && newPin) {
        try {
          // Show progress modal
          setRotationProgressVisible(true);

          const result = await rotatePinAndReencryptData(
            oldPin,
            newPin,
            (progress) => {
              setRotationProgress(progress);
            },
          );

          setRotationProgressVisible(false);

          if (result.success) {
            showAlert(
              "Success",
              `PIN updated successfully! Re-encrypted ${result.rotatedCount} accounts.`,
            );
          } else {
            const failedMessage =
              result.failedAccounts.length > 0
                ? ` ${result.failedAccounts.length} accounts failed to re-encrypt.`
                : "";
            showAlert(
              "Warning",
              `PIN updated but there were issues with data re-encryption.${failedMessage} ${result.error || ""}`,
            );
          }

          // Reload account data count
          await loadAccountsWithData();
        } catch (error) {
          setRotationProgressVisible(false);
          showAlert("Error", "Failed to complete PIN rotation");
          console.error(error);
        }

        // Update pin exists state
        setPinExists(true);
      }

      // Reset the operation
      setCurrentOperation(null);
      setOldPin(null);
    },
    [oldPin, showAlert, loadAccountsWithData],
  );

  /**
   * Handles cancellation of PIN rotation flow
   */
  const handlePinRotationCancel = useCallback(() => {
    setPinRotationFlowVisible(false);
    setCurrentOperation(null);
    setOldPin(null);
  }, []);

  /**
   * Handles completion of PIN creation (non-rotation)
   */
  const handlePinCreationComplete = useCallback(
    async (success: boolean) => {
      setPinCreationVisible(false);

      if (success) {
        // Update pin exists state
        setPinExists(true);
        showAlert("Success", "PIN created successfully!");
      }

      // Reset the operation
      setCurrentOperation(null);
    },
    [showAlert],
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
   * Gets the rotation warning message based on accounts with data
   */
  const getRotationMessage = useCallback(() => {
    const baseMessage = "You are about to change your PIN.";
    if (accountsWithData > 0) {
      return `${baseMessage} This will automatically re-encrypt all secure data for ${accountsWithData} account${accountsWithData > 1 ? "s" : ""}. Continue?`;
    }
    return `${baseMessage} Continue?`;
  }, [accountsWithData]);

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
        showSuccessAlert={true}
      />

      {/* PIN Rotation Flow */}
      <PinRotationFlow
        visible={pinRotationFlowVisible}
        onComplete={handlePinRotationComplete}
        onCancel={handlePinRotationCancel}
      />

      {/* PIN Rotation Progress Modal */}
      <PinRotationProgressModal
        visible={rotationProgressVisible}
        progress={rotationProgress}
        onClose={() => setRotationProgressVisible(false)}
      />

      {/* Confirmation Modal for PIN Rotation */}
      <ConfirmationModal
        visible={rotatePinModalVisible}
        title="Rotate PIN"
        message={getRotationMessage()}
        confirmText="Continue"
        onConfirm={confirmRotatePin}
        onCancel={() => setRotatePinModalVisible(false)}
      />
    </View>
  );
});

EnterPinScreen.displayName = "EnterPinScreen";

export default EnterPinScreen;
