import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../styles/styles";

/**
 * Component shown during app initialization
 */
export const InitializingApp: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 16,
    marginTop: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
