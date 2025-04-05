import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { styles } from "../../styles/styles";

interface ConfirmPinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (match: boolean) => void;
  pin1: string;
  pin2: string;
}

export function ConfirmPinModal({
  visible,
  onClose,
  onConfirm,
  pin1,
  pin2,
}: ConfirmPinModalProps) {
  const arePinsMatching = pin1 === pin2;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <Text style={styles.modalTitle}>Confirm PIN Match</Text>
          <Text style={styles.modalSubtitle}>
            Do the entered PINs match?
          </Text>
          <Text style={styles.modalSubtitle}>
            PIN 1: {pin1}
          </Text>
          <Text style={styles.modalSubtitle}>
            PIN 2: {pin2}
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => onConfirm(arePinsMatching)}
            >
              <Text style={styles.buttonText}>
                {arePinsMatching ? "Yes, Confirm" : "No, They Don't Match"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: "80%",
  },
});
