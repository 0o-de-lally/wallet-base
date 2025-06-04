import React from "react";
import { View, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import LibraSDKTest from "../components/libra/LibraSDKTest";

export default function LibraTestScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "Libra SDK Test",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LibraSDKTest />
      </ScrollView>
    </View>
  );
}
