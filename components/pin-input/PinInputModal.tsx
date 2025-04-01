import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { getValue } from '../../util/secure_store';
import { comparePins, HashedPin } from '../../util/pin_security';
import { styles } from '../../styles/styles';

interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  onPinVerified: (pin: string) => void;
  purpose: 'save' | 'retrieve' | 'delete';
}

export function PinInputModal({
  visible,
  onClose,
  onPinVerified,
  purpose
}: PinInputModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPin = async () => {
    if (!pin.trim()) {
      setError('PIN is required');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Get the stored hashed PIN
      const savedPinJson = await getValue('user_pin');

      if (!savedPinJson) {
        setError('No PIN has been set up. Please set up a PIN first.');
        return;
      }

      try {
        // Parse the stored PIN from JSON
        const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

        // Use the comparePins function to properly compare PINs
        const isPinValid = await comparePins(storedHashedPin, pin);

        if (isPinValid) {
          // PIN verified successfully
          onPinVerified(pin.toString());
          setPin('');
        } else {
          setError('Incorrect PIN. Please try again.');
        }
      } catch (parseError) {
        console.error('Error parsing stored PIN:', parseError);
        setError('PIN verification failed. Please set up your PIN again.');
      }
    } catch (error) {
      setError('Error verifying PIN. Please try again.');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError(null);
    onClose();
  };

  // Get action text based on purpose
  const getActionText = () => {
    switch (purpose) {
      case 'save': return 'save';
      case 'retrieve': return 'retrieve';
      case 'delete': return 'delete';
      default: return 'access';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter PIN</Text>
          <Text style={styles.modalSubtitle}>
            Please enter your PIN to {getActionText()} this secure data.
          </Text>

          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter 6-digit PIN"
            keyboardType="number-pad"
            secureTextEntry={true}
            maxLength={6}
            autoFocus={true}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isVerifying}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={verifyPin}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
