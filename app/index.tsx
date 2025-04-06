import React, { useEffect } from "react";
import { View, StatusBar, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SecureStorageScreen from "../components/secure-storage/SecureStoreMain";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { styles } from "../styles/styles";
import { initializeDefaultProfile } from "../util/app-config-store";
import { ModalProvider } from "../context/ModalContext";

// Main App component that combines the functionality
export default function App() {
  return (
    <SafeAreaProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </SafeAreaProvider>
  );
}

// Content component with observer for reactive updates
const AppContent = observer(() => {
  // Use the useRouter hook to get the router instance
  const router = useRouter();

  useEffect(() => {
    initializeDefaultProfile();
  }, []);

  return (
    <>
      <StatusBar backgroundColor={styles.root.backgroundColor} />

      <View style={[styles.root]}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.navigate("/pin")}
          >
            <Text style={styles.navButtonText}>PIN Management</Text>
          </TouchableOpacity>

          {/* Use the router from useRouter hook */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.navigate("/profiles")}
          >
            <Text style={styles.navButtonText}>Profile Management</Text>
          </TouchableOpacity>

          {/* New button for Reveal Screen */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.navigate("/reveal")}
          >
            <Text style={styles.navButtonText}>Reveal Secure Data</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <SecureStorageScreen />
        </View>
      </View>
    </>
  );
});
