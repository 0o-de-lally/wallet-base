import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActionButton } from "./common/ActionButton";

interface InitializationErrorProps {
  error: Error;
}

/**
 * Component shown when app initialization fails
 */
export const InitializationError: React.FC<InitializationErrorProps> = ({ error }) => {
  const handleRetry = () => {
    // In React Native, we can't directly use window.location.reload()
    // Instead, we could implement app restart logic here
    console.log("Retry initialization");
    // For a real implementation, you might want to use:
    // import { DevSettings } from 'react-native';
    // DevSettings.reload();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Initialization Failed</Text>
      <Text style={styles.text}>
        There was a problem starting the wallet application.
      </Text>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
      <ActionButton
        text="Retry"
        onPress={handleRetry}
        style={styles.button}
        accessibilityLabel="Retry initialization"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#d32f2f",
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    width: "100%",
    marginBottom: 24,
  },
  errorText: {
    color: "#d32f2f",
  },
  button: {
    backgroundColor: "#5e35b1",
  },
});
