import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Modal } from "react-native";
import { PinInputField } from "./PinInputField";
import { ActionButton } from "../common/ActionButton";
import { styles } from "../../styles/styles";
import { validatePinFormat, hashPin } from "../../util/pin-security";
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
    if (!validatePinFormat(pin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    setError(null);
    setStep("confirm");
  }, [pin]);

  const createPin = useCallback(async () => {
    if (!validatePinFormat(pin) || !validatePinFormat(confirmPin)) {
      setError("PIN must be exactly 6 digits");
      setIsCreating(false);
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      setIsCreating(false);
      return;
    }

    try {
      // Hash the PIN and store it
      const hashedPin = await hashPin(pin);
      await saveValue("user_pin", JSON.stringify(hashedPin));

      // Refresh setup status to trigger UI updates
      refreshSetupStatus();

      // Provide the raw PIN to the parent for re-encryption
      const rawPin = pin;

      // Clear PIN from memory
      setPin("");
      setConfirmPin("");

      resetState();
      onComplete(true, rawPin);
    } catch (error) {
      console.error("Error creating PIN:", error);
      setError("Failed to create PIN. Please try again.");
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
      <Text style={styles.modalTitle}>Create Your New PIN</Text>
      <Text style={styles.modalSubtitle}>
        Choose a new 6-digit PIN to secure your wallet. All your encrypted data
        will be re-encrypted with this new PIN.
      </Text>

      <PinInputField
        label="Enter new 6-digit PIN:"
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
          variant="secondary"
          onPress={handleCancel}
          accessibilityLabel="Cancel PIN rotation"
        />

        <ActionButton
          text="Next"
          onPress={validateAndProceed}
          disabled={pin.length !== 6}
          accessibilityLabel="Proceed to confirm new PIN"
        />
      </View>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <Text style={styles.modalTitle}>Confirm Your New PIN</Text>
      <Text style={styles.modalSubtitle}>
        Please enter your new PIN again to confirm it.
      </Text>

      <PinInputField
        label="Confirm new PIN:"
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
          variant="secondary"
          onPress={handleBackToCreate}
          disabled={isCreating}
          accessibilityLabel="Go back to PIN creation"
        />

        <ActionButton
          text="Rotate PIN"
          onPress={handleCreatePin}
          isLoading={isCreating}
          disabled={isCreating || confirmPin.length !== 6}
          accessibilityLabel="Confirm PIN rotation"
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
