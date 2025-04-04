import React from "react";
import { View, StatusBar, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SecureStorageScreen from "../components/secure-storage/SecureStoreMain";
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
  return (
    <>
      <StatusBar backgroundColor={styles.root.backgroundColor} />

      <View style={[styles.root]}>
        <View style={styles.container}>
          <Link href="/pin" asChild>
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navButtonText} testID="your-element-id">
                PIN Management
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View
          style={[
            styles.container,
            // {
            //   paddingTop: insets.top,
            //   paddingBottom: insets.bottom,
            //   paddingLeft: insets.left,
            //   paddingRight: insets.right,
            //   backgroundColor: primaryColor,
            // },
          ]}
        >
          <SecureStorageScreen />
        </View>
      </View>
    </>
  );
});
