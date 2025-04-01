import React from "react";
import { Text, View, TextInput, TouchableOpacity } from "react-native";
import { styles } from "./styles";

interface SecureStorageFormProps {
  key: string;
  value: string;
  onKeyChange: (text: string) => void;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onRetrieve: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

export function SecureStorageForm({
  key,
  value,
  onKeyChange,
  onValueChange,
  onSave,
  onRetrieve,
  onDelete,
  isLoading
}: SecureStorageFormProps) {
  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Key:</Text>
        <TextInput
          style={styles.input}
          value={key}
          onChangeText={onKeyChange}
          placeholder="Enter storage key"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Value:</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onValueChange}
          placeholder="Enter value to store"
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
    </>
  );
}
