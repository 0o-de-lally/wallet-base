import React from "react";
import ConfirmationModal from "../modal/ConfirmationModal";
import { PinInputModal } from "../pin-input/PinInputModal";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { AccountMode } from "./types";

interface RecoveryModalsProps {
  successModalVisible: boolean;
  selectedProfile: string;
  mode: AccountMode;
  secureStorage: ReturnType<typeof useSecureStorage>;
  onSuccess: () => void;
}

export const RecoveryModals: React.FC<RecoveryModalsProps> = ({
  successModalVisible,
  selectedProfile,
  mode,
  secureStorage,
  onSuccess,
}) => {
  const getSuccessMessage = () => {
    const action = mode === "recover" ? "recovered" : "created";
    return `Account ${action} and added to "${selectedProfile}" successfully.`;
  };

  return (
    <>
      {/* Success Modal */}
      <ConfirmationModal
        visible={successModalVisible}
        title="Success"
        message={getSuccessMessage()}
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
