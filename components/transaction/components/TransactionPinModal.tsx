import React, { memo, useState, useCallback } from "react";
import { Modal, View, Text } from "react-native";
import { styles } from "../../../styles/styles";
import { ActionButton } from "../../common/ActionButton";
import { PinInputField } from "../../pin-input/PinInputField";

interface TransactionPinModalProps {
  visible: boolean;
  onClose: () => void;
  onPinSubmit: (pin: string) => Promise<void>;
  isLoading?: boolean;
  operationType?: "transfer" | "v8_rejoin" | null;
}

export const TransactionPinModal = memo(
  ({
    visible,
    onClose,
    onPinSubmit,
    isLoading = false,
    operationType,
  }: TransactionPinModalProps) => {
    const [pin, setPin] = useState("");
    const [pinError, setPinError] = useState<string | null>(null);

    const getModalTitle = () => {
      switch (operationType) {
        case "transfer":
          return "Authorize Transfer";
        case "v8_rejoin":
          return "Authorize V8 RE-JOIN";
        default:
          return "Verify PIN";
      }
    };

    const getModalSubtitle = () => {
      switch (operationType) {
        case "transfer":
          return "Enter your PIN to access private key for transfer signing";
        case "v8_rejoin":
          return "Enter your PIN to access private key for V8 migration transaction";
        default:
          return "Enter your PIN to access private key for transaction signing";
      }
    };

    const handleSubmit = useCallback(async () => {
      if (!pin.trim()) {
        setPinError("Please enter your PIN");
        return;
      }

      setPinError(null);

      try {
        await onPinSubmit(pin);
        setPin(""); // Clear PIN on success
      } catch (error) {
        console.error("PIN submission error:", error);
        setPinError("Failed to verify PIN. Please try again.");
      }
    }, [pin, onPinSubmit]);

    const handleClose = useCallback(() => {
      setPin("");
      setPinError(null);
      onClose();
    }, [onClose]);

    const handlePinChange = useCallback(
      (newPin: string) => {
        setPin(newPin);
        if (pinError) {
          setPinError(null); // Clear error when user starts typing
        }
      },
      [pinError],
    );

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>

            <Text style={styles.modalSubtitle}>{getModalSubtitle()}</Text>

            <View style={{ marginVertical: 20 }}>
              <PinInputField
                label="PIN"
                value={pin}
                onChangeText={handlePinChange}
                editable={!isLoading}
                autoFocus={true}
                error={pinError || undefined}
                onSubmit={handleSubmit}
              />
            </View>

            <View style={styles.buttonContainer}>
              <ActionButton
                text="Verify PIN"
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={isLoading || !pin.trim()}
                accessibilityLabel="Verify PIN for transaction"
              />

              <ActionButton
                text="Cancel"
                onPress={handleClose}
                variant="secondary"
                disabled={isLoading}
                style={{ marginTop: 10 }}
                accessibilityLabel="Cancel PIN verification"
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

TransactionPinModal.displayName = "TransactionPinModal";
