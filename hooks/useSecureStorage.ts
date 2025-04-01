import { useState } from 'react';
import { Alert } from 'react-native';
import { saveValue, getValue, deleteValue } from '../util/secure_store';
import { encryptWithPin, decryptWithPin } from '../util/crypto';

// Fixed key for all secure storage operations
const FIXED_KEY = "private_key";

export function useSecureStorage() {
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<'save' | 'retrieve' | 'delete' | null>(null);

  const requestPinForAction = (action: 'save' | 'retrieve' | 'delete') => {
    setCurrentAction(action);
    setPinModalVisible(true);
  };

  const handlePinVerified = async (pin: string) => {
    setPinModalVisible(false);

    switch (currentAction) {
      case 'save':
        await saveWithPin(pin);
        break;
      case 'retrieve':
        await retrieveWithPin(pin);
        break;
      case 'delete':
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
      // Encrypt the value with the PIN before saving
      const encryptedValue = encryptWithPin(value, pin);
      await saveValue(FIXED_KEY, encryptedValue);
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
      const encryptedResult = await getValue(FIXED_KEY);

      if (encryptedResult === null) {
        setStoredValue(null);
        Alert.alert("Info", "No value found");
        return;
      }

      // Decrypt the value with the PIN
      const decryptedValue = decryptWithPin(encryptedResult, pin);
      setStoredValue(decryptedValue);

      if (!decryptedValue) {
        Alert.alert("Error", "Failed to decrypt value. Incorrect PIN or corrupted data.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to retrieve or decrypt value");
      console.error(error);
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

  const handleSave = () => {
    if (!value.trim()) {
      Alert.alert("Error", "Please enter a value to store");
      return;
    }
    requestPinForAction('save');
  };

  const handleRetrieve = () => {
    requestPinForAction('retrieve');
  };

  const handleDelete = () => {
    requestPinForAction('delete');
  };

  return {
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleRetrieve,
    handleDelete,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction
  };
}
