import React, { memo, useState, useCallback } from "react";
import { Modal, View, Text } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { PinInputField } from "./PinInputField";
import { hashPin, validatePin } from "../../util/pin-security";
import { saveValue } from "../../util/secure-store";
import { useModal } from "../../context/ModalContext";
import { refreshSetupStatus } from "../../util/setup-state";

interface PinCreationFlowProps {
  visible: boolean;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
  showSuccessAlert?: boolean;
}

export const PinCreationFlow: React.FC<PinCreationFlowProps> = memo(
  ({ visible, onComplete, onCancel, showSuccessAlert = true }) => {
    const [step, setStep] = useState<"create" | "confirm">("create");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const { showAlert } = useModal();

    // Reset state when modal closes
    const resetState = useCallback(() => {
      setStep("create");
      setPin("");
      setConfirmPin("");
      setError(null);
      setIsCreating(false);
    }, []);

    const handleCancel = useCallback(() => {
      resetState();
      onCancel();
    }, [resetState, onCancel]);

    const handlePinChange = useCallback((text: string) => {
      setPin(text);
      setError(null);
    }, []);

    const handleConfirmPinChange = useCallback((text: string) => {
      setConfirmPin(text);
      setError(null);
    }, []);

    const validateAndProceed = useCallback(() => {
      if (!validatePin(pin)) {
        setError("PIN must be exactly 6 digits");
        return;
      }

      setStep("confirm");
    }, [pin]);

    const createPin = useCallback(async () => {
      if (pin !== confirmPin) {
        setError("PINs do not match. Please try again.");
        return;
      }

      try {
        setIsCreating(true);
        setError(null);

        // Hash the PIN and store it
        const hashedPin = await hashPin(pin);
        await saveValue("user_pin_hash", JSON.stringify(hashedPin));

        // Clear PIN from memory
        setPin("");
        setConfirmPin("");

        // Refresh setup status to trigger UI updates
        refreshSetupStatus();

        if (showSuccessAlert) {
          showAlert("PIN Created", "Your PIN has been created successfully.");
        }

        resetState();
        onComplete(true);
      } catch (error) {
        console.error("Error creating PIN:", error);
        setError("Failed to create PIN. Please try again.");
        setIsCreating(false);
      }
    }, [pin, confirmPin, showSuccessAlert, showAlert, resetState, onComplete]);

    const handleBackToCreate = useCallback(() => {
      setStep("create");
      setConfirmPin("");
      setError(null);
    }, []);

    const renderCreateStep = () => (
      <>
        <Text style={styles.modalTitle}>Create Your PIN</Text>
        <Text style={styles.modalSubtitle}>
          Choose a 6-digit PIN to secure your wallet. You'll need this PIN to access your accounts and sensitive operations.
        </Text>

        <PinInputField
          label="Enter 6-digit PIN:"
          value={pin}
          onChangeText={handlePinChange}
          placeholder="******"
          error={error || undefined}
          autoFocus={true}
          maxLength={6}
        />

        <View style={styles.modalButtons}>
          <ActionButton
            text="Cancel"
            onPress={handleCancel}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
            accessibilityLabel="Cancel PIN creation"
          />

          <ActionButton
            text="Next"
            onPress={validateAndProceed}
            disabled={pin.length !== 6}
            style={styles.confirmButton}
            accessibilityLabel="Proceed to confirm PIN"
          />
        </View>
      </>
    );

    const renderConfirmStep = () => (
      <>
        <Text style={styles.modalTitle}>Confirm Your PIN</Text>
        <Text style={styles.modalSubtitle}>
          Please enter your PIN again to confirm it.
        </Text>

        <PinInputField
          label="Confirm 6-digit PIN:"
          value={confirmPin}
          onChangeText={handleConfirmPinChange}
          placeholder="******"
          error={error || undefined}
          autoFocus={true}
          maxLength={6}
        />

        <View style={styles.modalButtons}>
          <ActionButton
            text="Back"
            onPress={handleBackToCreate}
            disabled={isCreating}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
            accessibilityLabel="Go back to PIN entry"
          />

          <ActionButton
            text="Create PIN"
            onPress={createPin}
            disabled={confirmPin.length !== 6}
            isLoading={isCreating}
            style={styles.confirmButton}
            accessibilityLabel="Create PIN"
          />
        </View>
      </>
    );

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel="PIN Creation Flow"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {step === "create" ? renderCreateStep() : renderConfirmStep()}
          </View>
        </View>
      </Modal>
    );
  }
);

PinCreationFlow.displayName = "PinCreationFlow";