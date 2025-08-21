import React from "react";
import { View } from "react-native";
import { ErrorLogsView } from "../components/dev/ErrorLogsView";
import { router } from "expo-router";
import { styles } from "../styles/styles";

/**
 * Error logs development screen
 */
export default function ErrorLogsScreen() {
  return (
    <View style={styles.flexOne}>
      <ErrorLogsView onClose={() => router.back()} />
    </View>
  );
}
