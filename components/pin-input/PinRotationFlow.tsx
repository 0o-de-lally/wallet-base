import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Modal } from "react-native";
import { PinInputField } from "./PinInputField";
import { ActionButton } from "../common/ActionButton";
import { styles } from "../../styles/styles";
import { validatePasswordPolicy, hashPin } from "../../util/pin-security";
import { saveValue } from "../../util/secure-store";
import { refreshSetupStatus } from "../../util/setup-state";

interface PinRotationFlowProps {
  visible: boolean;
  onComplete: (success: boolean, newPin?: string) => void;
  onCancel: () => void;
}

export const PinRotationFlow: React.FC<PinRotationFlowProps> = ({
  visible,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reset state when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setStep("create");
      setPin("");
      setConfirmPin("");
      setError(null);
      setIsCreating(false);
    }
  }, [visible]);

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

  const handlePinChange = useCallback(
    (newPin: string) => {
      setPin(newPin);
      if (error) {
        setError(null);
      }
    },
    [error],
  );

  const handleConfirmPinChange = useCallback(
    (newConfirmPin: string) => {
      setConfirmPin(newConfirmPin);
      if (error) {
        setError(null);
      }
    },
    [error],
  );

  const validateAndProceed = useCallback(() => {
    if (!validatePasswordPolicy(pin)) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    setStep("confirm");
  }, [pin]);

  const createPin = useCallback(async () => {
    if (!validatePasswordPolicy(pin) || !validatePasswordPolicy(confirmPin)) {
      setError("Password must be at least 8 characters");
      setIsCreating(false);
      return;
    }

    if (pin !== confirmPin) {
      setError("Passwords do not match");
      setIsCreating(false);
      return;
    }

    try {
      const hashedPin = await hashPin(pin);
      await saveValue("user_pin", JSON.stringify(hashedPin));
      refreshSetupStatus();
      const rawPin = pin;
      setPin("");
      setConfirmPin("");
      resetState();
      onComplete(true, rawPin);
    } catch (error) {
      console.error("Error creating password:", error);
      setError("Failed to create password. Please try again.");
      setIsCreating(false);
    }
  }, [pin, confirmPin, resetState, onComplete]);

  const handleBackToCreate = useCallback(() => {
    setStep("create");
    setConfirmPin("");
    setError(null);
  }, []);

  const handleCreatePin = useCallback(() => {
    setIsCreating(true);
    setError(null);
    createPin().catch(() => {
      setIsCreating(false);
    });
  }, [createPin]);

  const renderCreateStep = () => (
    <>
      <Text style={styles.modalTitle}>Create Your New Password</Text>
      <Text style={styles.modalSubtitle}>
        Choose a new password (minimum 8 characters). All encrypted data will be re-encrypted with it.
      </Text>

      <PinInputField
        label="Enter new password:"
        value={pin}
        onChangeText={handlePinChange}
        placeholder="********"
        error={error || undefined}
        autoFocus={true}
        maxLength={128}
        numericOnly={false}
      />

      <View style={styles.modalButtons}>
        <ActionButton
          text="Cancel"
          variant="secondary"
          onPress={handleCancel}
          accessibilityLabel="Cancel PIN rotation"
        />

        <ActionButton
          text="Next"
            onPress={validateAndProceed}
            disabled={!validatePasswordPolicy(pin)}
            accessibilityLabel="Proceed to confirm new password"
        />
      </View>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <Text style={styles.modalTitle}>Confirm Your New Password</Text>
      <Text style={styles.modalSubtitle}>
        Please enter your new password again to confirm it.
      </Text>

      <PinInputField
        label="Confirm new password:"
        value={confirmPin}
        onChangeText={handleConfirmPinChange}
        placeholder="********"
        error={error || undefined}
        autoFocus={true}
        maxLength={128}
        numericOnly={false}
      />

      <View style={styles.modalButtons}>
        <ActionButton
          text="Back"
          variant="secondary"
          onPress={handleBackToCreate}
          disabled={isCreating}
          accessibilityLabel="Go back to PIN creation"
        />

        <ActionButton
          text="Rotate Secret"
          onPress={handleCreatePin}
          isLoading={isCreating}
          disabled={isCreating || !validatePasswordPolicy(confirmPin)}
          accessibilityLabel="Confirm password rotation"
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
      accessibilityLabel="PIN rotation flow"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {step === "create" ? renderCreateStep() : renderConfirmStep()}
        </View>
      </View>
    </Modal>
  );
};
