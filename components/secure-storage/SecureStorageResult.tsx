import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../styles/styles";

interface SecureStorageResultProps {
  storedValue: string | null;
}

export function SecureStorageResult({ storedValue }: SecureStorageResultProps) {
  if (storedValue === null) return null;

  return (
    <View style={styles.resultContainer}>
      <Text style={styles.resultLabel}>Retrieved Value:</Text>
      <Text style={styles.resultValue}>{storedValue}</Text>
    </View>
  );
}
