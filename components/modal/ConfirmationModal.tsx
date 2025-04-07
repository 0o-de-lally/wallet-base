import React, { memo } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { styles } from "../../styles/styles";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationModal = memo(
  ({
    visible,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isDestructive = false,
  }: ConfirmationModalProps) => {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onCancel}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel={title}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>{message}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onCancel}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={cancelText}
                accessibilityHint="Dismisses the modal"
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  isDestructive ? styles.dangerButton : styles.confirmButton,
                ]}
                onPress={onConfirm}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={confirmText}
                accessibilityHint={
                  isDestructive
                    ? "This action cannot be undone"
                    : "Confirms the action"
                }
              >
                <Text
                  style={
                    isDestructive ? styles.dangerButtonText : styles.buttonText
                  }
                >
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

ConfirmationModal.displayName = "ConfirmationModal";

export default ConfirmationModal;
