import React, { memo, useCallback } from "react";
import { View } from "react-native";
import { styles } from "../../styles/styles";
import { useModal } from "../../context/ModalContext";
import ConfirmationModal from "../modal/ConfirmationModal";
import { PinInputModal } from "../pin-input/PinInputModal";
import { PinCreationFlow } from "../pin-input/PinCreationFlow";
import { PinRotationFlow } from "../pin-input/PinRotationFlow";
import { PinOperationsSection } from "./PinOperationsSection";
import { PinRotationProgressDisplay } from "./PinRotationProgress";
import { usePinManagement } from "./hooks/usePinManagement";
import { usePinRotation } from "./hooks/usePinRotation";

/**
 * Main PIN management container component
 */
const PinManagementContainer = memo(() => {
  const {
    // State
    isLoading,
    pinExists,
    currentOperation,
    oldPin,
    accountsWithData,
    pinModalVisible,
    rotatePinModalVisible,
    pinCreationVisible,
    pinRotationFlowVisible,
    showRotationProgress,
    
    // Actions
    setLoading,
    setPinExists,
    setCurrentOperation,
    setOldPin,
    updateModalState,
    loadAccountsWithData,
  } = usePinManagement();

  const {
    rotationProgress,
    handleVerifyPin,
    validateOldPin,
    executeRotation,
    getRotationMessage,
  } = usePinRotation();

  const { showAlert } = useModal();

  /**
   * Handles PIN verification for the verify operation
   */
  const handlePinVerification = useCallback(
    async (pin: string): Promise<void> => {
      setLoading(true);
      try {
        await handleVerifyPin(pin);
      } finally {
        setLoading(false);
        updateModalState({ pinModalVisible: false });
      }
    },
    [handleVerifyPin, setLoading, updateModalState]
  );

  /**
   * Handles old PIN verification for rotation
   */
  const handleOldPinVerified = useCallback(
    async (oldPinValue: string): Promise<void> => {
      setLoading(true);

      try {
        const isValid = await validateOldPin(oldPinValue, accountsWithData);
        if (isValid) {
          // Store the old PIN for re-encryption later
          setOldPin(oldPinValue);
          // Close the verification modal and show PIN rotation flow
          updateModalState({ 
            pinModalVisible: false, 
            pinRotationFlowVisible: true 
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [validateOldPin, accountsWithData, setOldPin, updateModalState, setLoading]
  );

  /**
   * Handles completion of PIN rotation flow
   */
  const handlePinRotationComplete = useCallback(
    async (success: boolean, newPin?: string) => {
      updateModalState({ pinRotationFlowVisible: false });

      if (success && oldPin && newPin) {
        const result = await executeRotation(
          oldPin,
          newPin,
          (showProgress) => updateModalState({ showRotationProgress: showProgress })
        );

        if (result.success) {
          // Reload account data count
          await loadAccountsWithData();
        }

        // Update pin exists state
        setPinExists(true);
      }

      // Reset the operation
      setCurrentOperation(null);
      setOldPin(null);
    },
    [oldPin, executeRotation, updateModalState, loadAccountsWithData, setPinExists, setCurrentOperation, setOldPin]
  );

  /**
   * Handles cancellation of PIN rotation flow
   */
  const handlePinRotationCancel = useCallback(() => {
    updateModalState({ pinRotationFlowVisible: false });
    setCurrentOperation(null);
    setOldPin(null);
  }, [updateModalState, setCurrentOperation, setOldPin]);

  /**
   * Handles completion of PIN creation (non-rotation)
   */
  const handlePinCreationComplete = useCallback(
    async (success: boolean) => {
      updateModalState({ pinCreationVisible: false });

      if (success) {
        // Update pin exists state
        setPinExists(true);
        showAlert("Success", "PIN created successfully!");
      }

      // Reset the operation
      setCurrentOperation(null);
    },
    [updateModalState, setPinExists, showAlert, setCurrentOperation]
  );

  /**
   * Handles PIN creation flow cancellation
   */
  const handlePinCreationCancel = useCallback(() => {
    updateModalState({ pinCreationVisible: false });
    setCurrentOperation(null);
    setOldPin(null);
  }, [updateModalState, setCurrentOperation, setOldPin]);

  /**
   * Handles dismissing the PIN rotation progress display
   */
  const handleDismissProgress = useCallback(() => {
    updateModalState({ showRotationProgress: false });
  }, [updateModalState]);

  /**
   * Initiates the PIN verification process
   */
  const startVerifyPin = useCallback(() => {
    setCurrentOperation("verify");
    updateModalState({ pinModalVisible: true });
  }, [setCurrentOperation, updateModalState]);

  /**
   * Initiates the PIN rotation process
   */
  const startRotatePin = useCallback(() => {
    updateModalState({ rotatePinModalVisible: true });
  }, [updateModalState]);

  /**
   * Confirms PIN rotation after warning dialog
   */
  const confirmRotatePin = useCallback(() => {
    updateModalState({ 
      rotatePinModalVisible: false,
      pinModalVisible: true 
    });
    setCurrentOperation("rotate");
  }, [updateModalState, setCurrentOperation]);

  /**
   * Initiates the PIN creation process
   */
  const startCreatePin = useCallback(() => {
    setCurrentOperation("create");
    updateModalState({ pinCreationVisible: true });
  }, [setCurrentOperation, updateModalState]);

  return (
    <View style={styles.container}>
      {/* Show PIN rotation progress inline when active */}
      {showRotationProgress && (
        <PinRotationProgressDisplay
          progress={rotationProgress}
          onDismiss={handleDismissProgress}
        />
      )}

      {/* Main operations section */}
      <PinOperationsSection
        pinExists={pinExists}
        isLoading={isLoading}
        showRotationProgress={showRotationProgress}
        onVerifyPin={startVerifyPin}
        onRotatePin={startRotatePin}
        onCreatePin={startCreatePin}
      />

      {/* PIN Input Modals */}
      <PinInputModal
        visible={pinModalVisible}
        onClose={() => updateModalState({ pinModalVisible: false })}
        onPinAction={
          currentOperation === "rotate" ? handleOldPinVerified : handlePinVerification
        }
        purpose="retrieve"
        actionTitle={
          currentOperation === "rotate" ? "Verify Current PIN" : "Verify PIN"
        }
        actionSubtitle={
          currentOperation === "rotate"
            ? "Enter your current PIN to begin the PIN change process"
            : "Enter your PIN to verify it's correct"
        }
      />

      {/* PIN Creation Flow */}
      <PinCreationFlow
        visible={pinCreationVisible}
        onComplete={handlePinCreationComplete}
        onCancel={handlePinCreationCancel}
        showSuccessAlert={true}
      />

      {/* PIN Rotation Flow */}
      <PinRotationFlow
        visible={pinRotationFlowVisible}
        onComplete={handlePinRotationComplete}
        onCancel={handlePinRotationCancel}
      />

      {/* Confirmation Modal for PIN Rotation */}
      <ConfirmationModal
        visible={rotatePinModalVisible}
        title="Rotate PIN"
        message={getRotationMessage(accountsWithData)}
        confirmText="Continue"
        onConfirm={confirmRotatePin}
        onCancel={() => updateModalState({ rotatePinModalVisible: false })}
      />
    </View>
  );
});

PinManagementContainer.displayName = "PinManagementContainer";

export default PinManagementContainer;
