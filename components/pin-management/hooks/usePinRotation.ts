import { useState, useCallback } from "react";
import { verifyStoredPassword } from "../../../util/password-security";
import {
  rotatePasswordAndReencryptData,
  validateOldPasswordCanDecryptData,
  type PasswordRotationProgress,
} from "../../../util/password-rotation";
import { useModal } from "../../../context/ModalContext";
import { devError } from "../../../util/error-utils";

/**
 * Custom hook for handling password rotation logic
 */
export const usePasswordRotation = () => {
  const [rotationProgress, setRotationProgress] =
    useState<PasswordRotationProgress>({
      total: 0,
      completed: 0,
      failed: [],
    });

  const { showAlert } = useModal();

  /**
   * Handles password verification when starting rotation
   */
  const handleVerifyPassword = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const result = await verifyStoredPassword(password);
        if (result.isValid) {
          showAlert("Success", "Password verified successfully");
          return true;
        } else {
          showAlert(
            "Incorrect Password",
            "The password you entered is incorrect",
          );
          return false;
        }
      } catch (error) {
        showAlert("Error", "Failed to verify password");
        devError("Pin rotation - verify password", error);
        return false;
      }
    },
    [showAlert],
  );

  /**
   * Validates old password and checks if it can decrypt existing data
   */
  const validateOldPassword = useCallback(
    async (oldPassword: string, accountsWithData: number): Promise<boolean> => {
      try {
        const result = await verifyStoredPassword(oldPassword);
        if (!result.isValid) {
          showAlert(
            "Incorrect Password",
            "The password you entered is incorrect",
          );
          return false;
        }

        // Additionally validate that the password can decrypt existing data
        if (accountsWithData > 0) {
          const validationResult =
            await validateOldPasswordCanDecryptData(oldPassword);
          if (!validationResult.isValid) {
            showAlert(
              "Password Validation Failed",
              `Cannot decrypt existing data with this password. ${validationResult.error || ""}`,
            );
            return false;
          }
        }

        return true;
      } catch (error) {
        showAlert("Error", "Failed to verify password");
        devError("Pin rotation - validate old password", error);
        return false;
      }
    },
    [showAlert],
  );

  /**
   * Executes the password rotation and data re-encryption
   */
  const executeRotation = useCallback(
    async (
      oldPassword: string,
      newPassword: string,
      onProgressUpdate: (showProgress: boolean) => void,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Initialize progress state
        setRotationProgress({
          total: 0,
          completed: 0,
          failed: [],
        });

        const result = await rotatePasswordAndReencryptData(
          oldPassword,
          newPassword,
          (progress: PasswordRotationProgress) => {
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
            `Password updated but there were issues with data re-encryption.${failedMessage} ${result.error || ""}`,
          );
        }

        return { success: result.success, error: result.error };
      } catch (error) {
        onProgressUpdate(false);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        showAlert("Error", "Failed to complete password rotation");
        devError("Pin rotation - execute rotation", error);
        return { success: false, error: errorMessage };
      }
    },
    [showAlert],
  );

  /**
   * Gets the rotation warning message based on accounts with data
   */
  const getRotationMessage = useCallback((accountsWithData: number) => {
    const baseMessage = "You are about to change your password.";
    if (accountsWithData > 0) {
      return `${baseMessage} This will automatically re-encrypt all secure data for ${accountsWithData} account${accountsWithData > 1 ? "s" : ""}. Continue?`;
    }
    return `${baseMessage} Continue?`;
  }, []);

  return {
    rotationProgress,
    handleVerifyPassword,
    validateOldPassword,
    executeRotation,
    getRotationMessage,
  };
};
