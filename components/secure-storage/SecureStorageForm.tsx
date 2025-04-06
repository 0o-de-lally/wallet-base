import React from "react";
import { Text, View, TextInput, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { useRouter } from "expo-router";
import { DangerZone } from "./DangerZone";

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
  const router = useRouter();

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
          style={[styles.button, disabled && styles.disabledButton]}
          onPress={onDelete}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
