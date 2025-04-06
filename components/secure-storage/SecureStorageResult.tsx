import React, { memo } from "react";
import { Text, View } from "react-native";
import { styles } from "../../styles/styles";

interface SecureStorageResultProps {
  storedValue: string | null;
}

export const SecureStorageResult = memo(
  ({ storedValue }: SecureStorageResultProps) => {
    if (storedValue === null || storedValue === undefined) return null;

    return (
      <View
        style={styles.resultContainer}
        accessible={true}
        accessibilityLabel={`Secure value retrieved: ${storedValue}`}
        accessibilityRole="text"
      >
        <Text style={styles.resultLabel}>Retrieved Value:</Text>
        <Text style={styles.resultValue} selectable={true}>
          {storedValue}
        </Text>
      </View>
    );
  },
);

SecureStorageResult.displayName = "SecureStorageResult";
