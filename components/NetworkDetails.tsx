import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../contexts/AppContext';

const NetworkDetails: React.FC = () => {
  const { networkConfig } = useNetwork();

  if (!networkConfig) return null;

  return (
    <View>
      <Text style={styles.title}>Network Configuration</Text>
      <Text>Type: {networkConfig.type}</Text>
      <Text>Chain ID: {networkConfig.chainId}</Text>
      <Text>RPC URL: {networkConfig.rpcUrl}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default NetworkDetails;
