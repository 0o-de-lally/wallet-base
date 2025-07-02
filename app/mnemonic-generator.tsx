import React from "react";
import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import MnemonicGenerator from "../components/libra/MnemonicGenerator";

export default function MnemonicGeneratorScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const initialMode = mode === "test" ? "test" : "create";
  const screenTitle = initialMode === "test" ? "Generate Mnemonic" : "Create New Account";

  return (
    <>
      <Stack.Screen
        options={{ title: screenTitle, headerBackTitle: "Back" }}
      />
      <View style={{ flex: 1 }}>
        <MnemonicGenerator initialMode={initialMode} />
      </View>
    </>
  );
}
