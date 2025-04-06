import { useState, useRef, useEffect } from "react";
import {
  saveValue,
  getValue,
  deleteValue,
  clearAllSecureStorage,
  scheduleReveal,
  checkRevealStatus,
  cancelReveal,
  clearAllScheduledReveals,
} from "../util/secure-store";
import {
  encryptWithPin,
  decryptWithPin,
  stringToUint8Array,
  uint8ArrayToString,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "../util/crypto";
import { useModal } from "../context/ModalContext";

// Fixed key for all secure storage operations
const FIXED_KEY = "private_key";

// Configuration for auto-hiding revealed values
const AUTO_HIDE_DELAY_MS = 30 * 1000; // 30 seconds

export function useSecureStorage() {
  const { showAlert } = useModal();
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    "save" | "schedule_reveal" | "execute_reveal" | "delete" | null
  >(null);
  const oldPinRef = useRef<string>("");

  // Add timer ref for auto-hiding the value
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State for reveal scheduling
  const [revealStatus, setRevealStatus] = useState<{
    isScheduled: boolean;
    isAvailable: boolean;
    isExpired: boolean;
    waitTimeRemaining: number;
    expiresIn: number;
  } | null>(null);

  // Clear the auto-hide timer when component unmounts
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, []);

  // Check reveal status periodically
  useEffect(() => {
    const checkStatus = () => {
      const status = checkRevealStatus(FIXED_KEY);
      if (status) {
        setRevealStatus({
          isScheduled: status.scheduled,
          isAvailable: status.available,
          isExpired: status.expired,
          waitTimeRemaining: status.waitTimeRemaining,
          expiresIn: status.expiresIn,
        });
      } else {
        setRevealStatus(null);
      }
    };

    // Initial check
    checkStatus();

    // Setup interval
    const intervalId = setInterval(checkStatus, 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, []);

  // Monitor storedValue and set up auto-hide timer when it changes
  useEffect(() => {
    // If a value has been revealed, set up timer to clear it
    if (storedValue !== null) {
      // Clear any existing timer first
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }

      // Set new timer to clear the value after delay
      autoHideTimerRef.current = setTimeout(() => {
        setStoredValue(null);
      }, AUTO_HIDE_DELAY_MS);
    }

    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [storedValue]);

  const requestPinForAction = (
    action: "save" | "schedule_reveal" | "execute_reveal" | "delete",
  ) => {
    setCurrentAction(action);
    setPinModalVisible(true);
  };

  const handlePinVerified = async (pin: string) => {
    setPinModalVisible(false);

    switch (currentAction) {
      case "save":
        await saveWithPin(pin);
        break;
      case "schedule_reveal":
        await scheduleRevealWithPin();
        break;
      case "execute_reveal":
        await executeRevealWithPin(pin);
        break;
      case "delete":
        await deleteSecurely();
        break;
    }

    setCurrentAction(null);
  };

  const saveWithPin = async (pin: string) => {
    if (!value.trim()) {
      showAlert("Error", "Please enter a value to store");
      return;
    }

    try {
      setIsLoading(true);

      // First verify this is really the user's PIN by checking if it's stored
      const savedPinJson = await getValue("user_pin");
      if (!savedPinJson) {
        showAlert(
          "Error",
          "Please set up a PIN in the PIN Management screen first",
        );
        return;
      }

      // Convert string value and PIN to Uint8Arrays
      const valueBytes = stringToUint8Array(value);
      const pinBytes = stringToUint8Array(pin);

      // Encrypt the value with the PIN before saving
      const encryptedBytes = await encryptWithPin(valueBytes, pinBytes);

      // Convert to base64 for storage
      const encryptedBase64 = uint8ArrayToBase64(encryptedBytes);

      await saveValue(FIXED_KEY, encryptedBase64);
      showAlert("Success", "Value saved securely and encrypted");
      setValue("");

      // Cancel any active reveals when saving a new value
      cancelReveal(FIXED_KEY);
      setRevealStatus(null);
    } catch (error) {
      showAlert("Error", "Failed to save encrypted value");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleRevealWithPin = async () => {
    try {
      setIsLoading(true);

      // Verify PIN is correct before scheduling
      const savedPinJson = await getValue("user_pin");
      if (!savedPinJson) {
        showAlert(
          "Error",
          "Please set up a PIN in the PIN Management screen first",
        );
        return;
      }

      // Schedule the reveal
      scheduleReveal(FIXED_KEY);

      // Update status
      const status = checkRevealStatus(FIXED_KEY);
      if (status) {
        setRevealStatus({
          isScheduled: status.scheduled,
          isAvailable: status.available,
          isExpired: status.expired,
          waitTimeRemaining: status.waitTimeRemaining,
          expiresIn: status.expiresIn,
        });
      }
    } catch (error) {
      showAlert("Error", "Failed to schedule reveal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRevealWithPin = async (pin: string) => {
    try {
      setIsLoading(true);

      // Check if reveal is available
      const status = checkRevealStatus(FIXED_KEY);
      if (!status || !status.available || status.expired) {
        showAlert(
          "Error",
          status && status.expired
            ? "Reveal window has expired. Please schedule again."
            : "No reveal scheduled or still in waiting period.",
        );
        return;
      }

      const encryptedBase64 = await getValue(FIXED_KEY);

      if (encryptedBase64 === null) {
        setStoredValue(null);
        showAlert("Error", "No value found");
        return;
      }

      // Convert from base64 to Uint8Array
      const encryptedBytes = base64ToUint8Array(encryptedBase64);

      // Convert PIN to Uint8Array
      const pinBytes = stringToUint8Array(pin);

      // Decrypt the value with the PIN and verify integrity
      const decryptResult = await decryptWithPin(encryptedBytes, pinBytes);

      if (!decryptResult) {
        setStoredValue(null);
        showAlert("Error", "Failed to decrypt value. Data may be corrupted.");
        return;
      }

      if (!decryptResult.verified) {
        // Wrong PIN was used - do not display any data
        setStoredValue(null);
        showAlert("Error", "Incorrect PIN. Unable to decrypt data.");
        return;
      }

      // Convert the decrypted bytes back to a string
      const decryptedString = uint8ArrayToString(decryptResult.value);

      // Set the revealed value - the useEffect will handle setting up auto-hide
      setStoredValue(decryptedString);

      // After successful reveal, cancel the scheduling (it's been used)
      cancelReveal(FIXED_KEY);
    } catch (error) {
      showAlert("Error", "Failed to retrieve or decrypt value");
      console.error(error);
      setStoredValue(null);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSecurely = async () => {
    try {
      setIsLoading(true);
      await deleteValue(FIXED_KEY);
      setStoredValue(null);

      // Also cancel any scheduled reveals
      cancelReveal(FIXED_KEY);
      setRevealStatus(null);

      showAlert("Success", "Value deleted");
    } catch (error) {
      showAlert("Error", "Failed to delete value");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      await clearAllSecureStorage();
      clearAllScheduledReveals();
      setStoredValue(null);
      setValue("");
      setRevealStatus(null);
      showAlert("Success", "All secure storage data has been cleared");
    } catch (error) {
      showAlert("Error", "Failed to clear secure storage");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!value.trim()) {
      showAlert("Error", "Please enter a value to store");
      return;
    }
    requestPinForAction("save");
  };

  const handleScheduleReveal = () => {
    requestPinForAction("schedule_reveal");
  };

  const handleExecuteReveal = () => {
    requestPinForAction("execute_reveal");
  };

  const handleCancelReveal = () => {
    try {
      cancelReveal(FIXED_KEY);
      setRevealStatus(null);
      showAlert("Info", "Reveal request canceled");
    } catch (error) {
      console.error("Error canceling reveal:", error);
    }
  };

  const handleDelete = () => {
    requestPinForAction("delete");
  };

  const reEncryptSecrets = async (newPin: string) => {
    try {
      setIsLoading(true);

      // 1. Retrieve the old encrypted value
      const encryptedBase64 = await getValue(FIXED_KEY);

      if (!encryptedBase64) {
        showAlert("Info", "No value found to re-encrypt");
        return;
      }

      // 2. Decrypt with the old PIN (which is stored in oldPinRef)
      const oldPin = oldPinRef.current;
      if (!oldPin) {
        showAlert("Error", "Old PIN is missing. Re-encryption aborted.");
        return;
      }

      const encryptedBytes = base64ToUint8Array(encryptedBase64);
      const oldPinBytes = stringToUint8Array(oldPin);

      // Debugging: Log the encrypted data and PIN being used for decryption
      console.log("Encrypted data (base64):", encryptedBase64);

      let decryptResult;
      try {
        decryptResult = await decryptWithPin(encryptedBytes, oldPinBytes);
      } catch (decryptError: unknown) {
        console.error("Decryption error:", decryptError);
        showAlert(
          "Error",
          `Decryption failed with error: ${
            (decryptError as Error).message
          }. Re-encryption aborted.`,
        );
        return;
      }

      if (!decryptResult || !decryptResult.verified) {
        showAlert(
          "Error",
          "Failed to decrypt with old PIN or integrity check failed. Re-encryption aborted.",
        );
        return;
      }

      const decryptedValue = uint8ArrayToString(decryptResult.value);

      // 3. Encrypt with the new PIN
      const newPinBytes = stringToUint8Array(newPin);
      const valueBytes = stringToUint8Array(decryptedValue);
      const newEncryptedBytes = await encryptWithPin(valueBytes, newPinBytes);
      const newEncryptedBase64 = uint8ArrayToBase64(newEncryptedBytes);

      // 4. Save the re-encrypted value
      await saveValue(FIXED_KEY, newEncryptedBase64);
      showAlert("Success", "Secrets re-encrypted with new PIN");
    } catch (error) {
      showAlert("Error", "Failed to re-encrypt secrets");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to clear the revealed value
  const clearRevealedValue = () => {
    // Clear the value
    setStoredValue(null);

    // Also clear the auto-hide timer
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  return {
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleScheduleReveal,
    handleExecuteReveal,
    handleCancelReveal,
    handleDelete,
    handleClearAll,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
    oldPinRef,
    reEncryptSecrets,
    revealStatus,
    clearRevealedValue,
  };
}
