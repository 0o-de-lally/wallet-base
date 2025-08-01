import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import { Modal, View, Text, TextInput } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { PinInputField } from "./PinInputField";
import { formatWaitingPeriod } from "../../util/reveal-controller";

// Define callback types for PIN operations
type PinActionCallback = (pin: string) => Promise<boolean>;

interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  purpose:
    | "save"
    | "retrieve"
    | "delete"
    | "schedule_reveal"
    | "execute_reveal"
    | "clear_all";
  // Callbacks for different PIN operations - only one will be called based on purpose
  onPinAction: PinActionCallback;
  actionTitle?: string;
  actionSubtitle?: string;
  autoCloseOnSuccess?: boolean; // New prop to control auto-close behavior
}

export const PinInputModal = memo(
  ({
    visible,
    onClose,
    purpose,
    onPinAction,
    actionTitle,
    actionSubtitle,
    autoCloseOnSuccess = true, // Default to true for backward compatibility
  }: PinInputModalProps) => {
    // Ensure onPinAction is always a function even if undefined is passed
    const safeOnPinAction = useCallback(
      async (pin: string) => {
        if (typeof onPinAction === "function") {
          try {
            console.log(`Executing onPinAction for purpose: ${purpose}`);
            const wasSuccessful = await onPinAction(pin);

            if (wasSuccessful) {
              console.log(`Completed onPinAction for purpose: ${purpose}`);
            } else {
              console.log(
                `PIN action failed for purpose: ${purpose} (e.g., incorrect PIN)`,
              );
            }
            return wasSuccessful;
          } catch (error) {
            console.error(
              `Error in onPinAction for purpose "${purpose}":`,
              error,
            );
            throw error; // Re-throw to be caught by the caller
          }
        } else {
          console.error(
            `ERROR: Missing onPinAction handler for purpose "${purpose}"`,
          );
          // Log additional context to help debug
          console.log("PinInputModal props received:", {
            purpose,
            hasOnPinAction: !!onPinAction,
            typeOfOnPinAction: typeof onPinAction,
            hasActionTitle: !!actionTitle,
            hasActionSubtitle: !!actionSubtitle,
            isVisible: visible,
          });

          setError(`Internal error: Action handler not found for "${purpose}"`);

          // Wait a bit before closing to show the error
          setTimeout(() => {
            onClose();
          }, 2000);

          // Return false as the action was not successful
          return false;
        }
      },
      [
        onPinAction,
        onClose,
        purpose,
        actionTitle,
        actionSubtitle,
        visible,
        autoCloseOnSuccess,
      ],
    );

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

        // Use the safe version that checks for function existence
        const wasSuccessful = await safeOnPinAction(currentPin);

        // Close the modal after successful action only if autoCloseOnSuccess is true
        if (wasSuccessful) {
          if (autoCloseOnSuccess) {
            onClose();
          }
        } else {
          setError("Incorrect PIN. Please try again.");
        }
      } catch (error) {
        console.error("Error processing PIN:", error);
        setError("Error processing your request");
      } finally {
        setIsVerifying(false);
      }
    }, [pinValue, safeOnPinAction, onClose]);

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
        case "clear_all":
          return "clear all data for";
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
        case "clear_all":
          return "Clear Account Data";
        default:
          return "Enter PIN";
      }
    }, [purpose, actionTitle]);

    const getSubtitle = useCallback(() => {
      if (actionSubtitle) return actionSubtitle;

      switch (purpose) {
        case "schedule_reveal":
          return `Enter your PIN to schedule a reveal of the secured data. You'll need to wait ${formatWaitingPeriod()} before you can reveal it.`;
        case "execute_reveal":
          return "Enter your PIN again to reveal the secured data. This data will be visible on screen.";
        case "clear_all":
          return "Enter your PIN to permanently delete all secure data for this account. This action cannot be undone.";
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
                variant="secondary"
                onPress={handleCancel}
                disabled={isVerifying}
                accessibilityLabel="Cancel PIN entry"
                style={{ flex: 1, marginRight: 8 }}
              />

              <ActionButton
                text="Verify"
                onPress={processPinSecurely}
                isLoading={isVerifying}
                accessibilityLabel="Verify PIN"
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

PinInputModal.displayName = "PinInputModal";
