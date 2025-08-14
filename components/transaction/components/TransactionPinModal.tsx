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
  operationType?: "transfer" | "v8_rejoin" | "vouch" | null;
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
          return "Authorize V8 Migration";
        case "vouch":
          return "Authorize Vouch";
        default:
          return "Verify Password";
      }
    };

    const getModalSubtitle = () => {
      switch (operationType) {
        case "transfer":
          return "Enter your password to access private key for transfer signing";
        case "v8_rejoin":
          return "Enter your password to access private key for V8 migration transaction";
        case "vouch":
          return "Enter your password to access private key for vouching transaction";
        default:
          return "Enter your password to access private key for transaction signing";
      }
    };

    const handleSubmit = useCallback(async () => {
      if (!pin.trim()) {
  setPinError("Please enter your password");
        return;
      }

      setPinError(null);

      try {
        await onPinSubmit(pin);
        setPin(""); // Clear PIN on success
      } catch (error) {
  console.error("Password submission error:", error);
  setPinError("Failed to verify password. Please try again.");
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
                label="Password"
                value={pin}
                onChangeText={handlePinChange}
                editable={!isLoading}
                autoFocus={true}
                error={pinError || undefined}
                onSubmit={handleSubmit}
                numericOnly={false}
              />
            </View>

            <View style={styles.buttonContainer}>
              <ActionButton
                text="Verify"
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={isLoading || !pin.trim()}
                accessibilityLabel="Verify password for transaction"
              />

              <ActionButton
                text="Cancel"
                onPress={handleClose}
                variant="secondary"
                disabled={isLoading}
                accessibilityLabel="Cancel password verification"
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

TransactionPinModal.displayName = "TransactionPinModal";
