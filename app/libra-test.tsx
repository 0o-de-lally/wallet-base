import React from "react";
import { View, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import LibraSDKTest from "../components/libra/LibraSDKTest";
import { SetupGuard } from "../components/auth/SetupGuard";

export default function LibraTestScreen() {
  return (
    <SetupGuard requiresPin={true} requiresAccount={true}>
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
    </SetupGuard>
  );
}
