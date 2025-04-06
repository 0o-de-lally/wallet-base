import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { getValue } from "../../util/secure-store";
import { comparePins, HashedPin } from "../../util/pin-security";
import { styles } from "../../styles/styles";

interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  onPinVerified: (pin: string) => void;
  purpose:
    | "save"
    | "retrieve"
    | "delete"
    | "schedule_reveal"
    | "execute_reveal";
}

export function PinInputModal({
  visible,
  onClose,
  onPinVerified,
  purpose,
}: PinInputModalProps) {
  const pinRef = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPin = async () => {
    const pinValue = pinRef.current.trim();
    if (!pinValue) {
      setError("PIN is required");
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Get the stored hashed PIN
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        setError("No PIN has been set up. Please set up a PIN first.");
        return;
      }

      try {
        // Parse the stored PIN from JSON
        const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

        // Use the comparePins function to properly compare PINs
        const isPinValid = await comparePins(storedHashedPin, pinValue);

        if (isPinValid) {
          // PIN verified successfully
          onPinVerified(pinValue);
          pinRef.current = ""; // clear immediately
        } else {
          setError("Incorrect PIN. Please try again.");
        }
      } catch (parseError) {
        console.error("Error parsing stored PIN:", parseError);
        setError("PIN verification failed. Please set up your PIN again.");
      }
    } catch (error) {
      setError("Error verifying PIN. Please try again.");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    pinRef.current = ""; // clear on cancel
    setError(null);
    onClose();
  };

  // Get action text based on purpose
  const getActionText = () => {
    switch (purpose) {
      case "save":
        return "save";
      case "retrieve":
        return "retrieve";
      case "schedule_reveal":
        return "schedule a reveal for";
      case "execute_reveal":
        return "reveal";
      case "delete":
        return "delete";
      default:
        return "access";
    }
  };

  // Get title based on purpose
  const getTitle = () => {
    switch (purpose) {
      case "schedule_reveal":
        return "Schedule Reveal";
      case "execute_reveal":
        return "Reveal Secured Data";
      default:
        return "Enter PIN";
    }
  };

  // Get subtitle based on purpose
  const getSubtitle = () => {
    switch (purpose) {
      case "schedule_reveal":
        return "Enter your PIN to schedule a reveal of the secured data. You'll need to wait 30 seconds before you can reveal it.";
      case "execute_reveal":
        return "Enter your PIN again to reveal the secured data. This data will be visible on screen.";
      default:
        return `Please enter your PIN to ${getActionText()} this secure data.`;
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
          <Text style={styles.modalTitle}>{getTitle()}</Text>
          <Text style={styles.modalSubtitle}>{getSubtitle()}</Text>

          <TextInput
            style={styles.pinInput}
            onChangeText={(text) => (pinRef.current = text)}
            placeholder="******"
            placeholderTextColor={styles.inputPlaceholder.color}
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
