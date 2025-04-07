import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import { Modal, View, Text, TextInput } from "react-native";
import { getValue } from "../../util/secure-store";
import { comparePins, HashedPin } from "../../util/pin-security";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { PinInputField } from "./PinInputField";

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

export const PinInputModal = memo(
  ({ visible, onClose, onPinVerified, purpose }: PinInputModalProps) => {
    const [pin, setPin] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const pinInputRef = useRef<TextInput>(null);

    useEffect(() => {
      if (!visible) {
        setPin("");
        setError(null);
      }
    }, [visible]);

    const verifyPin = useCallback(async () => {
      if (!pin.trim()) {
        setError("PIN is required");
        return;
      }

      try {
        setIsVerifying(true);
        setError(null);

        const savedPinJson = await getValue("user_pin");

        if (!savedPinJson) {
          setError("No PIN has been set up. Please set up a PIN first.");
          return;
        }

        try {
          const storedHashedPin: HashedPin = JSON.parse(savedPinJson);
          const isPinValid = await comparePins(storedHashedPin, pin);

          if (isPinValid) {
            onPinVerified(pin);
            setPin("");
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
    }, [pin, onPinVerified]);

    const handleCancel = useCallback(() => {
      setPin("");
      setError(null);
      onClose();
    }, [onClose]);

    const getActionText = useCallback(() => {
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
    }, [purpose]);

    const getTitle = useCallback(() => {
      switch (purpose) {
        case "schedule_reveal":
          return "Schedule Reveal";
        case "execute_reveal":
          return "Reveal Secured Data";
        default:
          return "Enter PIN";
      }
    }, [purpose]);

    const getSubtitle = useCallback(() => {
      switch (purpose) {
        case "schedule_reveal":
          return "Enter your PIN to schedule a reveal of the secured data. You'll need to wait 30 seconds before you can reveal it.";
        case "execute_reveal":
          return "Enter your PIN again to reveal the secured data. This data will be visible on screen.";
        default:
          return `Please enter your PIN to ${getActionText()} this secure data.`;
      }
    }, [purpose, getActionText]);

    const handlePinChange = useCallback((text: string) => {
      setPin(text);
    }, []);

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel={getTitle()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <Text style={styles.modalSubtitle}>{getSubtitle()}</Text>

            <PinInputField
              value={pin}
              onChangeText={handlePinChange}
              placeholder="******"
              label=""
              error={error ? error : undefined}
              autoFocus={true}
              onSubmit={verifyPin}
              clearOnSubmit={true}
              ref={pinInputRef}
            />

            <View style={styles.modalButtons}>
              <ActionButton
                text="Cancel"
                onPress={handleCancel}
                disabled={isVerifying}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
                accessibilityLabel="Cancel PIN entry"
              />

              <ActionButton
                text="Verify"
                onPress={verifyPin}
                isLoading={isVerifying}
                style={styles.confirmButton}
                accessibilityLabel="Verify PIN"
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

PinInputModal.displayName = "PinInputModal";
