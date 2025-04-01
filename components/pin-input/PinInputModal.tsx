import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getValue } from '../../util/secure_store';
import { hashPin } from '../../util/pin_security';

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
      const savedPin = await getValue('user_pin');

      if (!savedPin) {
        setError('No PIN has been set up. Please set up a PIN first.');
        return;
      }

      // Hash the entered PIN to compare with stored PIN
      const hashedInputPin = hashPin(pin);

      if (hashedInputPin === savedPin) {
        // PIN verified successfully
        onPinVerified(pin);
        setPin('');
      } else {
        setError('Incorrect PIN. Please try again.');
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
              <Text style={styles.buttonText}>Cancel</Text>
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#007AFF',
  },
});
