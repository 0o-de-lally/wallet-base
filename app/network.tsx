import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NetworkConfigGenerator } from '../util/networkSettings';
import { NetworkConfig } from '../types/networkTypes';
import { ChainName } from '../types/networkTypes';

export default function NetworkScreen() {
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const generator = NetworkConfigGenerator.getInstance();
        const config = await generator.initializeNetworkConfig(ChainName.MAINNET);
        setNetworkConfig(config.activeNetwork);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to initialize network config:', error);
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  if (!networkConfig) {
    return (
      <View style={styles.container}>
        <Text>Loading network configuration...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Configuration</Text>
      <Text>Type: {networkConfig.type}</Text>
      <Text>Chain ID: {networkConfig.chainId}</Text>
      <Text>RPC URL: {networkConfig.rpcUrl}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});
