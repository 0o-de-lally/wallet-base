import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import MnemonicGenerator from "../components/libra/MnemonicGenerator";

export default function MnemonicGeneratorScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Generate Mnemonic", headerBackTitle: "Back" }} />
      <View style={{ flex: 1 }}>
        <MnemonicGenerator />
      </View>
    </>
  );
}
