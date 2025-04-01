import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import SecureStorageScreen from './secure_store';
import { appConfig, initializeSettings } from '../util/settings';
import { observer } from '@legendapp/state/react';

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
});
