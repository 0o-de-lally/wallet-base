import React from "react";
import { View } from "react-native";
import { ErrorLogsView } from "../components/dev/ErrorLogsView";
import { router } from "expo-router";

/**
 * Error logs development screen
 */
export default function ErrorLogsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ErrorLogsView onClose={() => router.back()} />
    </View>
  );
}
