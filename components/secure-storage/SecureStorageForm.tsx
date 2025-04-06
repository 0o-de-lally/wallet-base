import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import ConfirmationModal from "../modal/ConfirmationModal";
import { useRouter } from "expo-router";

interface SecureStorageFormProps {
  value: string;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClearAll?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function SecureStorageForm({
  value,
  onValueChange,
  onSave,
  onDelete,
  onClearAll,
  isLoading,
  disabled = false,
}: SecureStorageFormProps) {
  const [clearAllModalVisible, setClearAllModalVisible] = useState(false);
  const router = useRouter();

  const handleClearAll = () => {
    if (!onClearAll) return;
    setClearAllModalVisible(true);
  };

  const confirmClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
    setClearAllModalVisible(false);
  };

  const navigateToReveal = () => {
    router.push("/reveal");
  };

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Private Value:</Text>
        <TextInput
          style={[styles.input, disabled && styles.disabledInput]}
          value={value}
          onChangeText={onValueChange}
          placeholder="Enter sensitive value to store"
          placeholderTextColor={styles.inputPlaceholder.color}
          multiline={true}
          numberOfLines={3}
          editable={!disabled}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabledButton]}
          onPress={onSave}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#6ba5d9' }]}
          onPress={navigateToReveal}
        >
          <Text style={styles.buttonText}>Go to Reveal Screen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, disabled && styles.disabledButton]}
          onPress={onDelete}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {onClearAll && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[
              styles.button,
              styles.dangerButton,
              disabled && styles.disabledButton,
            ]}
            onPress={handleClearAll}
            disabled={isLoading || disabled}
          >
            <Text style={styles.dangerButtonText}>
              Clear All Secure Storage
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        visible={clearAllModalVisible}
        title="Clear All Secure Storage"
        message="This will delete ALL secure data and cannot be undone. Continue?"
        confirmText="Clear All"
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllModalVisible(false)}
        isDestructive={true}
      />
    </>
  );
}
