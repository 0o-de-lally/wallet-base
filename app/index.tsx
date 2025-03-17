import '@/util/polyfills';

import { StyleSheet, View } from 'react-native';
import NetworkScreen from '../components/network/NetworkScreen';
import { Provider } from 'react-redux';
import React from 'react';
import LedgerIndex from '@/components/LedgerIndex';
import { store } from '@/store';

export default function HomeScreen() {

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <NetworkScreen />
        <LedgerIndex />
      </View>
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
