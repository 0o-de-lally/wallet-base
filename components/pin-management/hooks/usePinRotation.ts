import { useState, useCallback } from "react";
import { verifyStoredPin } from "../../../util/pin-security";
import {
  rotatePinAndReencryptData,
  validateOldPinCanDecryptData,
  type PinRotationProgress,
} from "../../../util/pin-rotation";
import { useModal } from "../../../context/ModalContext";

/**
 * Custom hook for handling PIN rotation logic
 */
export const usePinRotation = () => {
  const [rotationProgress, setRotationProgress] = useState<PinRotationProgress>(
    {
      total: 0,
      completed: 0,
      failed: [],
    },
  );

  const { showAlert } = useModal();

  /**
   * Handles PIN verification when starting rotation
   */
  const handleVerifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      try {
        const isValid = await verifyStoredPin(pin);
        if (isValid) {
          showAlert("Success", "PIN verified successfully");
          return true;
        } else {
          showAlert("Incorrect PIN", "The PIN you entered is incorrect");
          return false;
        }
      } catch (error) {
        showAlert("Error", "Failed to verify PIN");
        console.error(error);
        return false;
      }
    },
    [showAlert],
  );

  /**
   * Validates old PIN and checks if it can decrypt existing data
   */
  const validateOldPin = useCallback(
    async (oldPin: string, accountsWithData: number): Promise<boolean> => {
      try {
        const isValid = await verifyStoredPin(oldPin);
        if (!isValid) {
          showAlert("Incorrect PIN", "The PIN you entered is incorrect");
          return false;
        }

        // Additionally validate that the PIN can decrypt existing data
        if (accountsWithData > 0) {
          const validationResult = await validateOldPinCanDecryptData(oldPin);
          if (!validationResult.isValid) {
            showAlert(
              "PIN Validation Failed",
              `Cannot decrypt existing data with this PIN. ${validationResult.error || ""}`,
            );
            return false;
          }
        }

        return true;
      } catch (error) {
        showAlert("Error", "Failed to verify PIN");
        console.error(error);
        return false;
      }
    },
    [showAlert],
  );

  /**
   * Executes the PIN rotation and data re-encryption
   */
  const executeRotation = useCallback(
    async (
      oldPin: string,
      newPin: string,
      onProgressUpdate: (showProgress: boolean) => void,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Initialize progress state
        setRotationProgress({
          total: 0,
          completed: 0,
          failed: [],
        });

        const result = await rotatePinAndReencryptData(
          oldPin,
          newPin,
          (progress) => {
            setRotationProgress(progress);
            // Show progress when we have accounts to process
            if (progress.total > 0) {
              onProgressUpdate(true);
            }
          },
        );

        // Hide progress immediately if no accounts were processed
        if (result.rotatedCount === 0 && result.failedAccounts.length === 0) {
          onProgressUpdate(false);
        }

        // Only show error alerts, not success since progress display shows success
        if (!result.success) {
          const failedMessage =
            result.failedAccounts.length > 0
              ? ` ${result.failedAccounts.length} accounts failed to re-encrypt.`
              : "";
          showAlert(
            "Warning",
            `PIN updated but there were issues with data re-encryption.${failedMessage} ${result.error || ""}`,
          );
        }

        return { success: result.success, error: result.error };
      } catch (error) {
        onProgressUpdate(false);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        showAlert("Error", "Failed to complete PIN rotation");
        console.error(error);
        return { success: false, error: errorMessage };
      }
    },
    [showAlert],
  );

  /**
   * Gets the rotation warning message based on accounts with data
   */
  const getRotationMessage = useCallback((accountsWithData: number) => {
    const baseMessage = "You are about to change your PIN.";
    if (accountsWithData > 0) {
      return `${baseMessage} This will automatically re-encrypt all secure data for ${accountsWithData} account${accountsWithData > 1 ? "s" : ""}. Continue?`;
    }
    return `${baseMessage} Continue?`;
  }, []);

  return {
    rotationProgress,
    handleVerifyPin,
    validateOldPin,
    executeRotation,
    getRotationMessage,
  };
};
