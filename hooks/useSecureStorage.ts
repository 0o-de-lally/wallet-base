import { useState } from 'react';
import { Alert } from 'react-native';
import { saveValue, getValue, deleteValue } from '../util/secure_store';

export function useSecureStorage() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!key.trim() || !value.trim()) {
      Alert.alert("Error", "Both key and value are required");
      return;
    }

    try {
      setIsLoading(true);
      await saveValue(key, value);
      Alert.alert("Success", "Value saved securely");
      setValue("");
    } catch (error) {
      Alert.alert("Error", "Failed to save value");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!key.trim()) {
      Alert.alert("Error", "Key is required");
      return;
    }

    try {
      setIsLoading(true);
      const result = await getValue(key);
      setStoredValue(result);

      if (result === null) {
        Alert.alert("Info", "No value found for this key");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to retrieve value");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!key.trim()) {
      Alert.alert("Error", "Key is required");
      return;
    }

    try {
      setIsLoading(true);
      await deleteValue(key);
      setStoredValue(null);
      Alert.alert("Success", "Value deleted");
    } catch (error) {
      Alert.alert("Error", "Failed to delete value");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    key,
    setKey,
    value,
    setValue,
    storedValue,
    isLoading,
    handleSave,
    handleRetrieve,
    handleDelete
  };
}
