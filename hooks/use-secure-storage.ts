import { useState, useRef, useEffect, useCallback } from "react";
import { saveValue, getValue, deleteValue } from "../util/secure-store";
import {
  scheduleReveal,
  checkRevealStatus,
  cancelReveal,
  REVEAL_CONFIG,
} from "../util/reveal-controller";
import { useModal } from "../context/ModalContext";
// Import from pin-security.ts instead of PinProcessor
import {
  verifyStoredPin,
  secureEncryptWithPin,
  secureDecryptWithPin,
} from "../util/pin-security";
import { updateAccountKeyStoredStatus } from "../util/app-config-store";
import { reportErrorAuto } from "../util/error-utils";

// Configuration for auto-hiding revealed values
const AUTO_HIDE_DELAY_MS = 30 * 1000; // 30 seconds

export function useSecureStorage(initialAccountId?: string) {
  const { showAlert } = useModal();
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    | "save"
    | "schedule_reveal"
    | "execute_reveal"
    | "delete"
    | "clear_all"
    | null
  >(null);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(
    initialAccountId || null,
  );

  // Add timer ref for auto-hiding the value
  // Cross environment issues with TimeoutTypes
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State for reveal scheduling
  const [revealStatus, setRevealStatus] = useState<{
    isScheduled: boolean;
    isAvailable: boolean;
    isExpired: boolean;
    waitTimeRemaining: number;
    expiresIn: number;
  } | null>(null);

  // Function to get storage key from account ID
  const getStorageKey = useCallback((accountId: string) => {
    return `account_${accountId}`;
  }, []);

  // Function to check if an account has stored data
  const checkHasStoredData = useCallback(
    async (accountId: string): Promise<boolean> => {
      try {
        const key = getStorageKey(accountId);
        const storedData = await getValue(key);
        return storedData !== null;
      } catch (error) {
        reportErrorAuto("useSecureStorage.hasStoredData", error, { accountId });
        return false;
      }
    },
    [getStorageKey],
  );

  // Clear the auto-hide timer when component unmounts
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, []);

  // Update current account ID when initial account ID changes
  useEffect(() => {
    if (initialAccountId && initialAccountId !== currentAccountId) {
      setCurrentAccountId(initialAccountId);
    }
  }, [initialAccountId, currentAccountId]);

  // Check reveal status periodically for the current account
  useEffect(() => {
    if (!currentAccountId) return;

    const checkStatus = () => {
      const status = checkRevealStatus(currentAccountId);
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
  }, [currentAccountId]);

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
    action:
      | "save"
      | "schedule_reveal"
      | "execute_reveal"
      | "delete"
      | "clear_all",
    accountId: string,
  ) => {
    console.log(
      `Setting action: ${action} for account ${accountId} and showing PIN modal`,
    );
    setCurrentAction(action);
    setCurrentAccountId(accountId);
    setPinModalVisible(true);
  };

  const saveSecurelyWithPin = async (pin: string) => {
    if (!value.trim()) {
      showAlert("Error", "Please enter a value to store");
      setPinModalVisible(false);
      return;
    }

    if (!currentAccountId) {
      showAlert("Error", "No account selected");
      setPinModalVisible(false);
      return;
    }

    try {
      setIsLoading(true);

      // First verify this is really the user's PIN
      const isValid = await verifyStoredPin(pin);
      if (!isValid) {
        showAlert("Error", "Invalid PIN");
        setPinModalVisible(false); // Close PIN modal on failure
        return;
      }

      // Use the pin-security utilities to encrypt data
      const encryptedBase64 = await secureEncryptWithPin(value, pin);

      if (!encryptedBase64) {
        throw new Error("Encryption failed");
      }

      const key = getStorageKey(currentAccountId);
      await saveValue(key, encryptedBase64);

      // Update the account's is_key_stored status
      updateAccountKeyStoredStatus(currentAccountId, true);

      setValue("");

      // Cancel any active reveals when saving a new value
      cancelReveal(currentAccountId);
      setRevealStatus(null);

      // Close PIN modal on success
      setPinModalVisible(false);
    } catch (error) {
      showAlert("Error", "Failed to save encrypted value");
      console.error(error);
      setPinModalVisible(false); // Close PIN modal on error
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleRevealWithPin = async (pin: string) => {
    try {
      setIsLoading(true);

      if (!currentAccountId) {
        throw new Error("No account selected");
      }

      // First verify this is really the user's PIN
      const isValid = await verifyStoredPin(pin);
      if (!isValid) {
        showAlert("Error", "Invalid PIN");
        setPinModalVisible(false); // Close the PIN modal on failure
        return; // Important: Return early to prevent scheduling with invalid PIN
      }

      // Schedule a reveal for the current account
      const result = scheduleReveal(currentAccountId);

      // Update the reveal status
      setRevealStatus({
        isScheduled: true,
        isAvailable: false,
        isExpired: false,
        waitTimeRemaining: REVEAL_CONFIG.waitingPeriodMs,
        expiresIn: REVEAL_CONFIG.waitingPeriodMs + REVEAL_CONFIG.revealWindowMs,
      });

      setPinModalVisible(false);

      if (result) {
        showAlert(
          "Success",
          `Reveal scheduled. You can reveal the data after the waiting period.`,
        );
      } else {
        showAlert("Error", "Failed to schedule reveal");
      }
    } catch (error) {
      showAlert("Error", "Failed to schedule reveal");
      console.error(error);
      setPinModalVisible(false); // Close PIN modal on error
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

      // Check if reveal is available
      const status = checkRevealStatus(currentAccountId);
      if (!status || !status.available || status.expired) {
        showAlert(
          "Error",
          status && status.expired
            ? "Reveal window has expired. Please schedule again."
            : "No reveal scheduled or still in waiting period.",
        );
        setPinModalVisible(false); // Close PIN modal on status error
        return;
      }

      const key = getStorageKey(currentAccountId);
      const encryptedBase64 = await getValue(key);

      if (encryptedBase64 === null) {
        setStoredValue(null);
        showAlert("Error", "No value found");
        setPinModalVisible(false); // Close PIN modal on data error
        return;
      }

      // Use pin-security utility to decrypt
      const decryptResult = await secureDecryptWithPin(encryptedBase64, pin);

      if (!decryptResult) {
        setStoredValue(null);
        showAlert(
          "Error",
          "Failed to decrypt. Incorrect PIN or corrupted data.",
        );
        setPinModalVisible(false); // Close PIN modal on failure
        return;
      }

      if (!decryptResult.verified) {
        // Wrong PIN was used - do not display any data
        setStoredValue(null);
        showAlert("Error", "Incorrect PIN. Unable to decrypt data.");
        setPinModalVisible(false); // Close PIN modal on failure
        return;
      }

      // Set the revealed value - the useEffect will handle setting up auto-hide
      setStoredValue(decryptResult.value);

      // After successful reveal, cancel the scheduling (it's been used)
      cancelReveal(currentAccountId);
      setPinModalVisible(false);
    } catch (error) {
      // Safely handle any uncaught errors
      console.warn(
        "Reveal process failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      showAlert("Error", "Failed to retrieve or decrypt value");
      setStoredValue(null);
      setPinModalVisible(false); // Close PIN modal on failure
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSecurely = async () => {
    try {
      setIsLoading(true);

      if (!currentAccountId) {
        throw new Error("No account selected");
      }

      const key = getStorageKey(currentAccountId);
      await deleteValue(key);
      setStoredValue(null);

      // Update the account's is_key_stored status
      updateAccountKeyStoredStatus(currentAccountId, false);

      // Also cancel any scheduled reveals
      cancelReveal(currentAccountId);
      setRevealStatus(null);

      showAlert("Success", "Value deleted");
      setPinModalVisible(false); // Close PIN modal on success
    } catch (error) {
      showAlert("Error", "Failed to delete value");
      console.error(error);
      setPinModalVisible(false); // Close PIN modal on error
    } finally {
      setIsLoading(false);
    }
  };

  const clearAccountDataWithPin = async (pin: string) => {
    try {
      setIsLoading(true);

      if (!currentAccountId) {
        throw new Error("No account selected");
      }

      // First verify this is really the user's PIN
      const isValid = await verifyStoredPin(pin);
      if (!isValid) {
        showAlert("Error", "Invalid PIN");
        setPinModalVisible(false);
        return;
      }

      // Clear the specific account's data
      const key = getStorageKey(currentAccountId);
      await deleteValue(key);

      // Update the account's is_key_stored status
      updateAccountKeyStoredStatus(currentAccountId, false);

      // Also cancel any scheduled reveals for this account
      cancelReveal(currentAccountId);

      // Clear UI state
      setStoredValue(null);
      setValue("");
      setRevealStatus(null);

      setPinModalVisible(false);
      showAlert("Success", "Account data cleared successfully");
    } catch (error) {
      showAlert("Error", "Failed to clear account data");
      console.error(error);
      setPinModalVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinAction = useCallback(
    async (pin: string) => {
      console.log(`Processing pin action: ${currentAction}`);
      if (!pin || !pin.trim()) {
        showAlert("Error", "PIN is required");
        setPinModalVisible(false); // Close modal on validation error
        setCurrentAction(null); // Reset action to prevent re-opening
        return;
      }

      try {
        // Handle different PIN action types
        if (currentAction === "save") {
          await saveSecurelyWithPin(pin);
        } else if (currentAction === "delete") {
          await deleteSecurely();
        } else if (currentAction === "schedule_reveal") {
          await scheduleRevealWithPin(pin);
        } else if (currentAction === "execute_reveal") {
          await executeRevealWithPin(pin);
        } else if (currentAction === "clear_all") {
          await clearAccountDataWithPin(pin);
        } else {
          console.error(`Unknown pin action: ${currentAction}`);
          showAlert("Error", "Unknown action requested");
          setPinModalVisible(false); // Close modal on unknown action
          setCurrentAction(null); // Reset action to prevent re-opening
        }

        // Reset action after successful completion
        setCurrentAction(null);
      } catch (error) {
        console.error(`Error in handlePinAction:`, error);
        showAlert("Error", "Failed to process your request");
        setPinModalVisible(false); // Close modal on unexpected error
        setCurrentAction(null); // Reset action to prevent re-opening
      }
    },
    [currentAction, showAlert, value],
  );

  const handleScheduleReveal = useCallback((accountId: string) => {
    requestPinForAction("schedule_reveal", accountId);
  }, []);

  const handleExecuteReveal = useCallback((accountId: string) => {
    requestPinForAction("execute_reveal", accountId);
  }, []);

  const handleCancelReveal = useCallback(
    (accountId: string) => {
      try {
        setIsLoading(true);
        const key = getStorageKey(accountId);
        cancelReveal(key);
        setRevealStatus(null);
      } catch (error) {
        showAlert("Error", "Failed to cancel reveal");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [showAlert, getStorageKey],
  );

  const handleDelete = useCallback((accountId: string) => {
    requestPinForAction("delete", accountId);
  }, []);

  const handleSave = useCallback(
    (accountId: string) => {
      if (!value.trim()) {
        showAlert("Error", "Please enter a value to store");
        return;
      }
      requestPinForAction("save", accountId);
    },
    [value, showAlert],
  );

  const handleSaveWithValue = useCallback(
    (accountId: string, valueToSave: string) => {
      if (!valueToSave.trim()) {
        showAlert("Error", "Please enter a value to store");
        return;
      }
      // Set the value first, then request PIN
      setValue(valueToSave);
      requestPinForAction("save", accountId);
    },
    [showAlert],
  );

  const handleClearAll = useCallback((accountId: string) => {
    requestPinForAction("clear_all", accountId);
  }, []);

  const clearRevealedValue = () => {
    // Clear the value
    setStoredValue(null);

    // Also clear the auto-hide timer
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  // Add a proper onClose handler that resets the action
  const handlePinModalClose = useCallback(() => {
    setPinModalVisible(false);
    setCurrentAction(null); // Reset action to prevent re-opening
  }, []);

  return {
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleSaveWithValue,
    handleScheduleReveal,
    handleExecuteReveal,
    handleCancelReveal,
    handleDelete,
    handleClearAll,
    pinModalVisible,
    setPinModalVisible,
    handlePinModalClose, // Export the proper close handler
    handlePinAction,
    currentAction,
    revealStatus,
    clearRevealedValue,
    checkHasStoredData,
  };
}
