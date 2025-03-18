import '@/util/polyfills';
import { StyleSheet, View } from 'react-native';
import NetworkScreen from '../components/network/NetworkScreen';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react';
import LedgerIndex from '@/components/LedgerIndex';
import { store, initializeWallet } from '@/store';
import Boot from './boot';

function AppContent() {
  useEffect(() => {
    initializeWallet();
  }, []);

  return (
    <View style={styles.container}>
      <Boot />

      <NetworkScreen />
      <LedgerIndex />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
