import React from "react";
import { View, StatusBar, TouchableOpacity, Text } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import SecureStorageScreen from "../components/secure-storage/SecureStoreMain";
import { appConfig } from "../util/settings-store";
import { observer } from "@legendapp/state/react";
import { Link } from "expo-router";
import { styles } from "../styles/styles";

// Main App component that combines the functionality
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

// Content component with observer for reactive updates
const AppContent = observer(() => {
  const insets = useSafeAreaInsets();
  const backgroundColor = appConfig.theme.backgroundColor.get();
  const primaryColor = appConfig.theme.primaryColor.get();

  return (
    <>
      <StatusBar
        backgroundColor={primaryColor}
        barStyle="dark-content"
        translucent={true}
      />

      <View style={[styles.root, { backgroundColor }]}>
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
              backgroundColor: primaryColor,
            },
          ]}
        >
          <SecureStorageScreen />

          <View style={styles.buttonContainer}>
            <Link href="/pin" asChild>
              <TouchableOpacity style={styles.navButton}>
                <Text style={styles.navButtonText} testID="your-element-id">
                  PIN Management
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </>
  );
});
