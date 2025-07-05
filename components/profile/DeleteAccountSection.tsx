import React, { memo, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { styles } from "../../styles/styles";
import ConfirmationModal from "../modal/ConfirmationModal";
import { ActionButton } from "../common/ActionButton";
import { deleteAccountCompletely } from "../../util/account-deletion";
import { useModal } from "../../context/ModalContext";

interface DeleteAccountSectionProps {
  accountId: string;
  accountNickname?: string;
  accountAddress: string;
}

export const DeleteAccountSection = memo(
  ({
    accountId,
    accountNickname,
    accountAddress,
  }: DeleteAccountSectionProps) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showAlert } = useModal();
    const router = useRouter();

    const handleDeletePress = () => {
      setShowConfirmation(true);
    };

    const handleConfirmDelete = async () => {
      setIsDeleting(true);
      
      try {
        const success = await deleteAccountCompletely(accountId);
        
        if (success) {
          showAlert(
            "Account Deleted",
            "The account has been successfully deleted."
          );
          // Navigate back to the main screen after showing alert
          setTimeout(() => router.replace("/"), 1000);
        } else {
          showAlert(
            "Error",
            "Failed to delete the account. Please try again."
          );
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        showAlert(
          "Error",
          "An unexpected error occurred while deleting the account."
        );
      } finally {
        setIsDeleting(false);
        setShowConfirmation(false);
      }
    };

    const handleCancelDelete = () => {
      setShowConfirmation(false);
    };

    const displayName = accountNickname || accountAddress;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <View style={styles.dangerContainer}>
          <Text style={styles.dangerTitle}>Delete Account</Text>
          <Text style={styles.dangerDescription}>
            This will permanently delete this account and remove all associated 
            data including mnemonics. This action cannot be undone.
          </Text>
          
          <ActionButton
            text={isDeleting ? "Deleting..." : "Delete Account"}
            onPress={handleDeletePress}
            disabled={isDeleting}
            variant="danger"
            accessibilityLabel="Delete account"
            accessibilityHint="Permanently deletes this account"
          />
        </View>

        <ConfirmationModal
          visible={showConfirmation}
          title="Delete Account"
          message={`Are you sure you want to delete "${displayName}"? This action will permanently remove the account, its mnemonic, and all associated data. This cannot be undone.`}
          confirmText="Delete Account"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDestructive={true}
        />
      </View>
    );
  }
);

DeleteAccountSection.displayName = "DeleteAccountSection";
