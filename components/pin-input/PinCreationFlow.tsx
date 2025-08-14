/* eslint-disable react/prop-types */
import React, { memo, useState, useCallback } from "react";
import { Modal, View, Text } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { PinInputField } from "./PinInputField";
import { hashPin, validatePasswordPolicy } from "../../util/pin-security";
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
      if (!validatePasswordPolicy(pin)) {
        setError("Password must be at least 8 characters");
        return;
      }
      setStep("confirm");
    }, [pin]);

    const createPin = useCallback(async () => {
      if (pin !== confirmPin) {
        setError("Passwords do not match. Please try again.");
        return;
      }

      if (!validatePasswordPolicy(pin)) {
        setError("Password must be at least 8 characters");
        return;
      }

      try {
        setIsCreating(true);
        setError(null);
        const hashedPin = await hashPin(pin);
        await saveValue("user_pin", JSON.stringify(hashedPin));
        setPin("");
        setConfirmPin("");
        refreshSetupStatus();
        if (showSuccessAlert) {
          showAlert(
            "Password Created",
            "Your password has been created successfully.",
          );
        }
        resetState();
        onComplete(true);
      } catch (error) {
        console.error("Error creating password:", error);
        setError("Failed to create password. Please try again.");
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
        <Text style={styles.modalTitle}>Create Your Password</Text>
        <Text style={styles.modalSubtitle}>
          Choose a strong password (minimum 8 characters) to secure your wallet. You&apos;ll need this password to access sensitive operations.
        </Text>

        <PinInputField
          label="Enter password:"
          value={pin}
          onChangeText={handlePinChange}
          placeholder="********"
          error={error || undefined}
          autoFocus={true}
          maxLength={128}
          showToggle={true}
        />

        <View style={styles.modalButtons}>
          <ActionButton
            text="Cancel"
            variant="secondary"
            onPress={handleCancel}
            accessibilityLabel="Cancel PIN creation"
          />

          <ActionButton
            text="Next"
            onPress={validateAndProceed}
            disabled={!validatePasswordPolicy(pin)}
            accessibilityLabel="Proceed to confirm password"
          />
        </View>
      </>
    );

    const renderConfirmStep = () => (
      <>
        <Text style={styles.modalTitle}>Confirm Your Password</Text>
        <Text style={styles.modalSubtitle}>
          Please enter your password again to confirm it.
        </Text>

        <PinInputField
          label="Confirm password:"
          value={confirmPin}
          onChangeText={handleConfirmPinChange}
          placeholder="********"
          error={error || undefined}
          autoFocus={true}
          maxLength={128}
          showToggle={true}
        />

        <View style={styles.modalButtons}>
          <ActionButton
            text="Back"
            variant="secondary"
            onPress={handleBackToCreate}
            disabled={isCreating}
            accessibilityLabel="Go back to PIN entry"
          />

          <ActionButton
            text="Create Password"
            onPress={createPin}
            disabled={!validatePasswordPolicy(confirmPin) || isCreating}
            isLoading={isCreating}
            accessibilityLabel="Create password"
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
  },
);

PinCreationFlow.displayName = "PinCreationFlow";
