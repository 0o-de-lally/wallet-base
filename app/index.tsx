import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import SecureStorageScreen from './secure_store';

// Create a wrapper component that uses hook instead of Consumer
function SafeAreaWrapper() {
  const insets = useSafeAreaInsets();

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
        }
      ]}
    >
      <SecureStorageScreen />
    </View>
  );
}

export default function App() {
  // Define consistent colors
  const backgroundColor = '#86f7ff';

  return (
    <>
      {/* Set status bar color and style */}
      <StatusBar
        backgroundColor={styles.container.backgroundColor}
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
    backgroundColor: '#11aaee',
  },
});
