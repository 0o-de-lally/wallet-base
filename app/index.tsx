import '@/util/polyfills';
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { initWallet, wallet, initClient } from "@/util/init";
import { LibraClient, Network } from 'open-libra-sdk';

export default function HomeContent() {
  const [addr, setAddr] = useState<string>('loading...');
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<LibraClient | null>(null);

  useEffect(() => {
    async function boot() {
      try {
        await initWallet("talent sunset lizard pill fame nuclear spy noodle basket okay critic grow sleep legend hurry pitch blanket clerk impose rough degree sock insane purse");
        const address = wallet.getAddress().toString();
        setAddr(address);

        const c = await initClient(Network.TESTNET, 'http://localhost:8280');
        setClient(c);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setAddr('Error loading address');
      }
    }

    boot();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Libra Wallet Demo </Text>
      <Text>{addr}</Text>
      <Text>{client?.config.network}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  }
});
