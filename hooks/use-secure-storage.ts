import { useState, useRef, useEffect, useCallback } from "react";
import {
  saveValue,
  getValue,
  deleteValue,
  clearAllSecureStorage,
} from "../util/secure-store";
import {
  scheduleReveal,
  checkRevealStatus,
  cancelReveal,
  clearAllScheduledReveals,
} from "../util/reveal-controller";
import { useModal } from "../context/ModalContext";
// Import from pin-security.ts instead of PinProcessor
import {
  verifyStoredPin,
  secureEncryptWithPin,
  secureDecryptWithPin
} from "../util/pin-security";

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

  // Need to track which account we're working with
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

  // Reference to store temporary PIN for re-encryption
  const oldPinRef = useRef<string | null>(null);

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

  const handlePinAction = useCallback(
    async (pin: string) => {
      if (currentAction === "save") {
        await saveSecurelyWithPin(pin);
      } else if (currentAction === "delete") {
        await deleteSecurely();
      } else if (currentAction === "schedule_reveal") {
        await scheduleRevealWithPin();
      } else if (currentAction === "execute_reveal") {
        await executeRevealWithPin(pin);
      }
    },
    [currentAction],
  );

  const scheduleRevealWithPin = async () => {
    try {
      setIsLoading(true);
      if (!currentAccountId) {
        throw new Error("No account selected");
      }

      const key = `account_${currentAccountId}`;

      // Schedule a reveal for the current key
      const result = scheduleReveal(key);

      // Use appropriate properties based on the actual implementation
      setPinModalVisible(false);

      if (result) {
        showAlert(
          "Success",
          `Reveal scheduled. You can reveal the data after the waiting period.`
        );
      } else {
        showAlert("Error", "Failed to schedule reveal");
      }
    } catch (error) {
      showAlert("Error", "Failed to schedule reveal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSecurelyWithPin = async (pin: string) => {
    if (!value.trim()) {
      showAlert("Error", "Please enter a value to store");
      return;
    }

    try {
      setIsLoading(true);

      // First verify this is really the user's PIN
      const isValid = await verifyStoredPin(pin);
      if (!isValid) {
        showAlert("Error", "Invalid PIN");
        return;
      }

      // Use the pin-security utilities to encrypt data
      const encryptedBase64 = await secureEncryptWithPin(value, pin);

      if (!encryptedBase64) {
        throw new Error("Encryption failed");
      }

      const key = `account_${currentAccountId || FIXED_KEY}`;
      await saveValue(key, encryptedBase64);

      showAlert("Success", "Value saved securely and encrypted");
      setValue("");

      // Cancel any active reveals when saving a new value
      cancelReveal(key);
      setRevealStatus(null);
    } catch (error) {
      showAlert("Error", "Failed to save encrypted value");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRevealWithPin = async (pin: string) => {
    try {
      setIsLoading(true);
      if (!currentAccountId) {
        throw new Error("No account selected");
      }

      const key = `account_${currentAccountId}`;

      // Check if reveal is available
      const status = checkRevealStatus(key);
      if (!status || !status.available || status.expired) {
        showAlert(
          "Error",
          status && status.expired
            ? "Reveal window has expired. Please schedule again."
            : "No reveal scheduled or still in waiting period.",
        );
        return;
      }

      const encryptedBase64 = await getValue(key);

      if (encryptedBase64 === null) {
        setStoredValue(null);
        showAlert("Error", "No value found");
        return;
      }

      // Use pin-security utility to decrypt
      const decryptResult = await secureDecryptWithPin(
        encryptedBase64,
        pin,
      );

      if (!decryptResult) {
        setStoredValue(null);
        showAlert(
          "Error",
          "Failed to decrypt value. Data may be corrupted.",
        );
        return;
      }

      if (!decryptResult.verified) {
        // Wrong PIN was used - do not display any data
        setStoredValue(null);
        showAlert("Error", "Incorrect PIN. Unable to decrypt data.");
        return;
      }

      // Set the revealed value - the useEffect will handle setting up auto-hide
      setStoredValue(decryptResult.value);

      // After successful reveal, cancel the scheduling (it's been used)
      cancelReveal(key);
      setPinModalVisible(false);
    } catch (error) {
      showAlert("Error", "Failed to retrieve or decrypt value");
      console.error(error);
      setStoredValue(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleReveal = useCallback((accountId: string) => {
    setCurrentAccountId(accountId);
    setCurrentAction("schedule_reveal");
    setPinModalVisible(true);
  }, []);

  const handleExecuteReveal = useCallback((accountId: string) => {
    setCurrentAccountId(accountId);
    setCurrentAction("execute_reveal");
    setPinModalVisible(true);
  }, []);

  const handleCancelReveal = useCallback((accountId: string) => {
    try {
      setIsLoading(true);
      const key = `account_${accountId}`;
      cancelReveal(key);
      setRevealStatus(null);
    } catch (error) {
      showAlert("Error", "Failed to cancel reveal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleDelete = useCallback(() => {
    requestPinForAction("delete");
  }, []);

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

  const reEncryptSecrets = async (newPin: string) => {
    try {
      setIsLoading(true);

      // Get the current key
      const key = currentAccountId ? `account_${currentAccountId}` : FIXED_KEY;

      // Retrieve the old encrypted value
      const encryptedBase64 = await getValue(key);

      if (!encryptedBase64) {
        showAlert("Info", "No value found to re-encrypt");
        return;
      }

      // Get old PIN from ref
      const oldPin = oldPinRef.current;
      if (!oldPin) {
        showAlert("Error", "Old PIN is missing. Re-encryption aborted.");
        return;
      }

      // Decrypt with old PIN
      const decryptResult = await secureDecryptWithPin(encryptedBase64, oldPin);

      if (!decryptResult || !decryptResult.verified) {
        showAlert(
          "Error",
          "Failed to decrypt with old PIN. Re-encryption aborted."
        );
        return;
      }

      // Now encrypt with new PIN
      const newEncryptedBase64 = await secureEncryptWithPin(
        decryptResult.value,
        newPin
      );

      // Save the re-encrypted value
      await saveValue(key, newEncryptedBase64);
      showAlert("Success", "Secrets re-encrypted with new PIN");

      // Clear old PIN ref for security
      oldPinRef.current = null;
    } catch (error) {
      showAlert("Error", "Failed to re-encrypt secrets");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle PIN verification independent of specific actions
  const handlePinVerified = useCallback((pin: string) => {
    // Store the verified PIN for possible re-encryption
    oldPinRef.current = pin;
  }, []);

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
    handlePinAction,
    handlePinVerified,
    currentAction,
    oldPinRef,
    reEncryptSecrets,
    revealStatus,
    clearRevealedValue,
    currentAccountId,
  };
}
