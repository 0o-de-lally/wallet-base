import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

/**
 * Component shown during app initialization
 */
export const InitializingApp: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5e35b1" />
      <Text style={styles.text}>Initializing wallet...</Text>
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
  text: {
    fontSize: 16,
    marginTop: 16,
    color: "#666",
    textAlign: "center",
  },
});
