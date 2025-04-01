import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import SecureStorageScreen from '../components/secure-storage/SecureStoreMain';
import { appConfig, initializeSettings } from '../util/settings';
import { observer } from '@legendapp/state/react';
import { Link } from 'expo-router';

// Create a wrapper component that uses hook instead of Consumer
const SafeAreaWrapper = observer(() => {
  const insets = useSafeAreaInsets();
  const primaryColor = appConfig.theme.primaryColor.get();

  return (
    <View
      style={[
        styles.container,
        {
          // Apply padding based on insets
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: primaryColor,
        }
      ]}
    >
      <SecureStorageScreen />
      <View style={styles.buttonContainer}>
        <Link href="/secure_store" asChild>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navButtonText}>Secure Storage Demo</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/pin" asChild>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navButtonText}>PIN Management</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
});

export default function App() {
  // Initialize settings on app startup
  useEffect(() => {
    // Initialize legend-state configuration
    initializeSettings();
    console.log('App settings initialized');
  }, []);

  // Get colors from the app config
  const backgroundColor = appConfig.theme.backgroundColor.get();

  return (
    <>
      {/* Set status bar color and style */}
      <StatusBar
        backgroundColor={appConfig.theme.primaryColor.get()}
        barStyle="dark-content"
        translucent={true}
      />

      {/* Root view with background color */}
      <View style={[styles.root, { backgroundColor }]}>
        {/* Provide SafeArea context */}
        <SafeAreaProvider>
          <SafeAreaWrapper />
        </SafeAreaProvider>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  navButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  navButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});
