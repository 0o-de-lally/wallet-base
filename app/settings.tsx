import React from "react";
import { Stack } from "expo-router";
import { Settings } from "../components/settings/Settings";

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerBackTitle: "Back" }} />
      <Settings />
    </>
  );
}
