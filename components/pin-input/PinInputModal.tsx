import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import { Modal, View, Text, TextInput } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { PinInputField } from "./PinInputField";

// Define callback types for PIN operations
type PinActionCallback = (pin: string) => Promise<void>;

interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  purpose:
    | "save"
    | "retrieve"
    | "delete"
    | "schedule_reveal"
    | "execute_reveal";
  // Callbacks for different PIN operations - only one will be called based on purpose
  onPinAction: PinActionCallback;
  actionTitle?: string;
  actionSubtitle?: string;
}

export const PinInputModal = memo(
  ({
    visible,
    onClose,
    purpose,
    onPinAction,
    actionTitle,
    actionSubtitle,
  }: PinInputModalProps) => {
    // Use a transient pin state - we'll clear it immediately after use
    const [pinValue, setPinValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const pinInputRef = useRef<TextInput>(null);

    useEffect(() => {
      if (!visible) {
        // Clear pin and error state when modal closes
        setPinValue("");
        setError(null);
      }
    }, [visible]);

    const processPinSecurely = useCallback(async () => {
      if (!pinValue || !pinValue.trim()) {
        setError("PIN is required");
        return;
      }

      try {
        setIsVerifying(true);
        setError(null);

        // Create a local copy of the PIN and clear the state immediately
        const currentPin = pinValue;
        setPinValue("");

        // Execute the operation with the PIN
        // We no longer need to verify the PIN separately since each action handles its own verification
        await onPinAction(currentPin);

        // Close the modal after successful action
        onClose();
      } catch (error) {
        console.error("Error processing PIN:", error);
        setError("Error processing your request");
      } finally {
        setIsVerifying(false);
      }
    }, [pinValue, onPinAction, onClose]);

    const handleCancel = useCallback(() => {
      setPinValue("");
      setError(null);
      onClose();
    }, [onClose]);

    const handlePinChange = useCallback((text: string) => {
      setPinValue(text);
    }, []);

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
      if (actionTitle) return actionTitle;

      switch (purpose) {
        case "schedule_reveal":
          return "Schedule Reveal";
        case "execute_reveal":
          return "Reveal Secured Data";
        default:
          return "Enter PIN";
      }
    }, [purpose, actionTitle]);

    const getSubtitle = useCallback(() => {
      if (actionSubtitle) return actionSubtitle;

      switch (purpose) {
        case "schedule_reveal":
          return "Enter your PIN to schedule a reveal of the secured data. You'll need to wait 30 seconds before you can reveal it.";
        case "execute_reveal":
          return "Enter your PIN again to reveal the secured data. This data will be visible on screen.";
        default:
          return `Please enter your PIN to ${getActionText()} this secure data.`;
      }
    }, [purpose, actionSubtitle, getActionText]);

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
              value={pinValue}
              onChangeText={handlePinChange}
              placeholder="******"
              label=""
              error={error ? error : undefined}
              autoFocus={true}
              onSubmit={processPinSecurely}
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
                onPress={processPinSecurely}
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
