import React, { memo } from "react";
import ConfirmationModal from "../modal/ConfirmationModal";

interface AccountListModalsProps {
  profileName: string;
  isDeleteModalVisible: boolean;
  successModalVisible: boolean;
  errorModalVisible: boolean;
  errorMessage: string;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDismissSuccess: () => void;
  onDismissError: () => void;
}

export const AccountListModals = memo(
  ({
    profileName,
    isDeleteModalVisible,
    successModalVisible,
    errorModalVisible,
    errorMessage,
    onConfirmDelete,
    onCancelDelete,
    onDismissSuccess,
    onDismissError,
  }: AccountListModalsProps) => {
    return (
      <>
        <ConfirmationModal
          visible={isDeleteModalVisible}
          title="Delete Account"
          message={`Are you sure you want to remove this account from "${profileName}"?`}
          confirmText="Delete"
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
          isDestructive={true}
        />

        <ConfirmationModal
          visible={successModalVisible}
          title="Success"
          message="Account has been removed from this profile."
          confirmText="OK"
          onConfirm={onDismissSuccess}
          onCancel={onDismissSuccess}
        />

        <ConfirmationModal
          visible={errorModalVisible}
          title="Error"
          message={errorMessage}
          confirmText="OK"
          onConfirm={onDismissError}
          onCancel={onDismissError}
        />
      </>
    );
  },
);

AccountListModals.displayName = "AccountListModals";
