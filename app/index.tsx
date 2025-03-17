import { StyleSheet, View } from 'react-native';
import NetworkScreen from './network';
import { CustomText } from '../components/CustomText';
import { Provider } from 'react-redux';
import { store } from '../src';
import React from 'react';
import LedgerIndex from '@/components/LedgerIndex';

export default function HomeScreen() {

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <CustomText>Welcome!</CustomText>
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
