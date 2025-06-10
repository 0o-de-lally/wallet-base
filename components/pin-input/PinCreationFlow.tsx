import React, { useState, useCallback, memo } from "react";
import { saveValue } from "../../util/secure-store";
import { hashPin, validatePin } from "../../util/pin-security";
import { useModal } from "../../context/ModalContext";
import { PinInputModal } from "./PinInputModal";

interface PinCreationFlowProps {
  visible: boolean;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
  showSuccessAlert?: boolean;
}

/**
 * Reusable PIN creation flow component that handles the two-step process:
 * 1. Create new PIN
 * 2. Confirm PIN
 *
 * This component can be used in onboarding, PIN management, and anywhere else
 * PIN creation is needed.
 */
export const PinCreationFlow = memo(({
  visible,
  onComplete,
  onCancel,
  showSuccessAlert = true,
}: PinCreationFlowProps) => {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { showAlert } = useModal();

  // Debug logging
  console.log("PinCreationFlow render:", { visible, step, hasTempPin: !!tempPin });

  /**
   * Handles new PIN creation during the first step
   */
  const handleNewPin = useCallback(
    async (pin: string): Promise<void> => {
      console.log("PinCreationFlow: handleNewPin called with pin length:", pin.length);

      if (!validatePin(pin)) {
        console.log("PinCreationFlow: PIN validation failed");
        showAlert("Invalid PIN", "PIN must be exactly 6 digits");
        return;
      }

      console.log("PinCreationFlow: PIN validated, setting temp PIN and moving to confirm step");
      // Store the new PIN temporarily and move to confirmation step
      setTempPin(pin);
      setStep("confirm");
    },
    [showAlert],
  );

  /**
   * Handles PIN confirmation during the second step
   */
  const handleConfirmPin = useCallback(
    async (confirmPin: string): Promise<void> => {
      setIsLoading(true);

      try {
        if (!validatePin(confirmPin)) {
          showAlert("Invalid PIN", "PIN must be exactly 6 digits");
          setIsLoading(false);
          return;
        }

        if (confirmPin !== tempPin) {
          showAlert("PIN Mismatch", "PINs do not match. Please try again.");
          // Reset to first step
          setStep("create");
          setTempPin(null);
          setIsLoading(false);
          return;
        }

        // Hash and save the new PIN
        const hashedPin = await hashPin(confirmPin);
        await saveValue("user_pin", JSON.stringify(hashedPin));

        // Reset state
        setStep("create");
        setTempPin(null);

        if (showSuccessAlert) {
          showAlert("Success", "PIN created successfully!");
        }

        // Notify parent of successful completion
        onComplete(true);
      } catch (error) {
        showAlert("Error", "Failed to save PIN. Please try again.");
        console.error("PIN save error:", error);

        // Reset to first step on error
        setStep("create");
        setTempPin(null);

        // Notify parent of failure
        onComplete(false);
      } finally {
        setIsLoading(false);
      }
    },
    [tempPin, showAlert, showSuccessAlert, onComplete],
  );

  /**
   * Handles modal close - resets state and calls onCancel
   */
  const handleClose = useCallback(() => {
    setStep("create");
    setTempPin(null);
    setIsLoading(false);
    onCancel();
  }, [onCancel]);

  return (
    <>
      {/* Create PIN Modal */}
      <PinInputModal
        visible={visible && step === "create"}
        onClose={handleClose}
        onPinAction={handleNewPin}
        purpose="save"
        actionTitle="Create Your PIN"
        actionSubtitle="Choose a 6-digit PIN to secure your wallet"
      />

      {/* Confirm PIN Modal */}
      <PinInputModal
        visible={visible && step === "confirm"}
        onClose={handleClose}
        onPinAction={handleConfirmPin}
        purpose="save"
        actionTitle="Confirm Your PIN"
        actionSubtitle="Enter your PIN again to confirm"
      />
    </>
  );
});

PinCreationFlow.displayName = "PinCreationFlow";
