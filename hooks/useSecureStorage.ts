import { useState } from "react";
import { Alert } from "react-native";
import {
  saveValue,
  getValue,
  deleteValue,
  clearAllSecureStorage,
} from "../util/secure_store";
import {
  encryptWithPin,
  decryptWithPin,
  stringToUint8Array,
  uint8ArrayToString,
  uint8ArrayToBase64,
  base64ToUint8Array
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

  const saveWithPin = async (pin: string) => {
    if (!value.trim()) {
      Alert.alert("Error", "Please enter a value to store");
      return;
    }

    try {
      setIsLoading(true);

      // First verify this is really the user's PIN by checking if it's stored
      const savedPinJson = await getValue("user_pin");
      if (!savedPinJson) {
        Alert.alert(
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
      Alert.alert("Success", "Value saved securely and encrypted");
      setValue("");
    } catch (error) {
      Alert.alert("Error", "Failed to save encrypted value");
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
        Alert.alert("Info", "No value found");
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
        Alert.alert("Error", "Failed to decrypt value. Data may be corrupted.");
        return;
      }

      if (!decryptResult.verified) {
        // Wrong PIN was used - do not display any data
        setStoredValue(null);
        Alert.alert("Error", "Incorrect PIN. Unable to decrypt data.");
        return;
      }

      // Convert the decrypted bytes back to a string
      const decryptedString = uint8ArrayToString(decryptResult.value);

      // Only set the stored value if verification passed
      setStoredValue(decryptedString);
    } catch (error) {
      Alert.alert("Error", "Failed to retrieve or decrypt value");
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
      Alert.alert("Success", "Value deleted");
    } catch (error) {
      Alert.alert("Error", "Failed to delete value");
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
      Alert.alert("Success", "All secure storage data has been cleared");
    } catch (error) {
      Alert.alert("Error", "Failed to clear secure storage");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!value.trim()) {
      Alert.alert("Error", "Please enter a value to store");
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
  };
}
