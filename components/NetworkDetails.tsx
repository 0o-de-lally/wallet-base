import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppContext } from '../app/context/AppContext';
import { CustomText } from './CustomText';

export default function NetworkDetails() {
  const { network_config } = useAppContext();

  return (
    <View style={styles.container}>
      <CustomText>Network: {network_config.type}</CustomText>
      <CustomText>Chain ID: {network_config.chainId}</CustomText>
      <CustomText>RPC URL: {network_config.rpcUrl}</CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
});
