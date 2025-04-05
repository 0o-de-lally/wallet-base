import { useState, useRef } from "react";
import { Alert } from "react-native";
import {
  saveValue,
  getValue,
  deleteValue,
  clearAllSecureStorage,
} from "../util/secure-store";
import {
  encryptWithPin,
  decryptWithPin,
  stringToUint8Array,
  uint8ArrayToString,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "../util/crypto";

// Fixed key for all secure storage operations
const FIXED_KEY = "private_key";

export function useSecureStorage() {
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    "save" | "retrieve" | "delete" | null
  >(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const oldPinRef = useRef<string>("");

  const requestPinForAction = (action: "save" | "retrieve" | "delete") => {
    setCurrentAction(action);
    setPinModalVisible(true);
  };

  const handlePinVerified = async (pin: string) => {
    setPinModalVisible(false);

    switch (currentAction) {
      case "save":
        await saveWithPin(pin);
        break;
      case "retrieve":
        await retrieveWithPin(pin);
        break;
      case "delete":
        await deleteSecurely();
        break;
    }

    setCurrentAction(null);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const saveWithPin = async (pin: string) => {
    if (!value.trim()) {
      showError("Please enter a value to store");
      return;
    }

    try {
      setIsLoading(true);

      // First verify this is really the user's PIN by checking if it's stored
      const savedPinJson = await getValue("user_pin");
      if (!savedPinJson) {
        showError("Please set up a PIN in the PIN Management screen first");
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
      showSuccess("Value saved securely and encrypted");
      setValue("");
    } catch (error) {
      showError("Failed to save encrypted value");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const retrieveWithPin = async (pin: string) => {
    try {
      setIsLoading(true);
      const encryptedBase64 = await getValue(FIXED_KEY);

      if (encryptedBase64 === null) {
        setStoredValue(null);
        showError("No value found");
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
        showError("Failed to decrypt value. Data may be corrupted.");
        return;
      }

      if (!decryptResult.verified) {
        // Wrong PIN was used - do not display any data
        setStoredValue(null);
        showError("Incorrect PIN. Unable to decrypt data.");
        return;
      }

      // Convert the decrypted bytes back to a string
      const decryptedString = uint8ArrayToString(decryptResult.value);

      // Only set the stored value if verification passed
      setStoredValue(decryptedString);
    } catch (error) {
      showError("Failed to retrieve or decrypt value");
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
      showSuccess("Value deleted");
    } catch (error) {
      showError("Failed to delete value");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      await clearAllSecureStorage();
      setStoredValue(null);
      setValue("");
      showSuccess("All secure storage data has been cleared");
    } catch (error) {
      showError("Failed to clear secure storage");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!value.trim()) {
      showError("Please enter a value to store");
      return;
    }
    requestPinForAction("save");
  };

  const handleRetrieve = () => {
    requestPinForAction("retrieve");
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
        Alert.alert("Info", "No value found to re-encrypt");
        return;
      }

      // 2. Decrypt with the old PIN (which is stored in oldPinRef)
      const oldPin = oldPinRef.current;
      if (!oldPin) {
        Alert.alert("Error", "Old PIN is missing. Re-encryption aborted.");
        return;
      }

      const encryptedBytes = base64ToUint8Array(encryptedBase64);
      const oldPinBytes = stringToUint8Array(oldPin);

      // Debugging: Log the encrypted data and PIN being used for decryption
      console.log("Encrypted data (base64):", encryptedBase64);

      let decryptResult;
      try {
        decryptResult = await decryptWithPin(encryptedBytes, oldPinBytes);
      } catch (decryptError) {
        console.error("Decryption error:", decryptError);
        Alert.alert(
          "Error",
          `Decryption failed with error: ${decryptError.message}. Re-encryption aborted.`,
        );
        return;
      }

      if (!decryptResult || !decryptResult.verified) {
        Alert.alert(
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
      Alert.alert("Success", "Secrets re-encrypted with new PIN");
    } catch (error) {
      Alert.alert("Error", "Failed to re-encrypt secrets");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleRetrieve,
    handleDelete,
    handleClearAll,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
    // For modals
    errorModalVisible,
    setErrorModalVisible,
    errorMessage,
    successModalVisible,
    setSuccessModalVisible,
    successMessage,
    oldPinRef,
    reEncryptSecrets,
  };
}
