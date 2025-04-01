import { useState } from 'react';
import { Alert } from 'react-native';
import { saveValue, getValue, deleteValue, clearAllSecureStorage } from '../util/secure_store';
import { encryptWithPin, decryptWithPin } from '../util/crypto';

// Fixed key for all secure storage operations
const FIXED_KEY = "private_key";

export function useSecureStorage() {
  const [value, setValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<'save' | 'retrieve' | 'delete' | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [modalStyle, setModalStyle] = useState({
    width: '80%',
    maxWidth: 300,
    padding: 20,
    borderRadius: 10,
  });

  // Update UI configuration for the PIN modal with more explicit settings
  const [pinInputConfig, setPinInputConfig] = useState({
    // Explicitly remove placeholder text
    placeholder: '',
    placeholderTextColor: 'transparent',

    // More visible label
    label: 'Enter PIN',
    labelStyle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 10,
    },

    // Input field styling
    inputStyle: {
      height: 50,
      borderWidth: 1,
      borderColor: '#CCCCCC',
      borderRadius: 5,
      paddingHorizontal: 10,
      fontSize: 16,
      backgroundColor: '#FFFFFF',
    },

    // Enhanced button configuration
    submitButtonText: 'Submit',
    cancelButtonText: 'Cancel',

    // More prominent button styles
    submitButtonStyle: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 5,
      marginTop: 20,
      alignItems: 'center',
    },
    submitButtonTextStyle: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
      textAlign: 'center',
    },

    // Cancel button styling
    cancelButtonStyle: {
      marginTop: 10,
      padding: 12,
      alignItems: 'center',
    },
    cancelButtonTextStyle: {
      color: '#007AFF',
      fontSize: 16,
    },
  });

  // Function to update PIN input configuration
  const updatePinInputConfig = (config: Partial<typeof pinInputConfig>) => {
    setPinInputConfig(prev => ({
      ...prev,
      ...config
    }));
  };

  const requestPinForAction = (action: 'save' | 'retrieve' | 'delete') => {
    setCurrentAction(action);
    setPinError(null); // Reset any previous errors
    setPinModalVisible(true);
  };

  const handlePinVerified = async (pin: string) => {
    setPinModalVisible(false);
    setPinError(null);

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

  // Function to handle pin input validation errors
  const handlePinError = (errorMessage: string) => {
    setPinError(errorMessage);
  };

  // Function to adjust modal styling if needed
  const adjustModalStyle = (styleUpdates: Record<string, any>) => {
    setModalStyle(prevStyle => ({
      ...prevStyle,
      ...styleUpdates
    }));
  };

  // Function to cancel pin input
  const cancelPinInput = () => {
    setPinModalVisible(false);
    setCurrentAction(null);
    setPinError(null);
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
    handleClearAll,
    pinModalVisible,
    setPinModalVisible,
    handlePinVerified,
    currentAction,
    pinError,
    handlePinError,
    modalStyle,
    adjustModalStyle,
    cancelPinInput,
    pinInputConfig,
    updatePinInputConfig
  };
}
