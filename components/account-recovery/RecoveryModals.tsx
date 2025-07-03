import React from "react";
import ConfirmationModal from "../modal/ConfirmationModal";
import { PinInputModal } from "../pin-input/PinInputModal";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { RecoveryState } from "./types";

interface RecoveryModalsProps {
  state: RecoveryState;
  secureStorage: ReturnType<typeof useSecureStorage>;
  onSuccess: () => void;
}

export const RecoveryModals: React.FC<RecoveryModalsProps> = ({
  state,
  secureStorage,
  onSuccess,
}) => {
  return (
    <>
      {/* Success Modal */}
      <ConfirmationModal
        visible={state.successModalVisible}
        title="Success"
        message={`Account recovered and added to "${state.selectedProfile}" successfully.`}
        confirmText="OK"
        onConfirm={onSuccess}
        onCancel={onSuccess}
      />

      {/* PIN Input Modal for Secure Storage */}
      <PinInputModal
        visible={secureStorage.pinModalVisible}
        onClose={secureStorage.handlePinModalClose}
        purpose="save"
        onPinAction={secureStorage.handlePinAction}
        actionTitle="Secure Mnemonic"
        actionSubtitle="Enter your PIN to securely save the recovery mnemonic"
      />
    </>
  );
};
