import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import SecureStorageScreen from './secure_store';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaInsetsContext.Consumer>
        {insets => (
          <View
            style={[
              styles.container,
              {
                paddingTop: insets?.top || 0,
                paddingBottom: insets?.bottom || 0,
                paddingLeft: insets?.left || 0,
                paddingRight: insets?.right || 0,
              }
            ]}
          >
            <SecureStorageScreen />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7ff',  // Light blue background color
  },
});
