import React from "react";
import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styles } from "./styles";

interface SecureStorageFormProps {
  value: string;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onRetrieve: () => void;
  onDelete: () => void;
  onClearAll?: () => void;
  isLoading: boolean;
}

export function SecureStorageForm({
  value,
  onValueChange,
  onSave,
  onRetrieve,
  onDelete,
  onClearAll,
  isLoading
}: SecureStorageFormProps) {
  const handleClearAll = () => {
    if (!onClearAll) return;

    Alert.alert(
      "Clear All Secure Storage",
      "This will delete ALL secure data and cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          onPress: onClearAll,
          style: "destructive"
        }
      ]
    );
  };

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Private Value:</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onValueChange}
          placeholder="Enter sensitive value to store"
          multiline={true}
          numberOfLines={3}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={onSave}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onRetrieve}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Retrieve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onDelete}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {onClearAll && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearAll}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Clear All Secure Storage</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
