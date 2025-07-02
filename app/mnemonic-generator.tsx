import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import MnemonicGenerator from "../components/libra/MnemonicGenerator";

export default function MnemonicGeneratorScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Create New Account", headerBackTitle: "Back" }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <MnemonicGenerator />
      </SafeAreaView>
    </>
  );
}
