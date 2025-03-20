import '@/util/polyfills';
import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { initWallet, wallet, initClient } from "../util/init";
import { LibraClient, Network } from 'open-libra-sdk';
import { ErrorLogger } from '../util/errorLogging';
import { sharedStyles } from '@/styles/shared';
import { useTranslation } from 'react-i18next';

export default function Boot() {
  const { t } = useTranslation();
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
        ErrorLogger.logError(err); // Add error logging
        setError(errorMessage);
        setAddr('Error loading address');
      }
    }

    boot();
  }, []);

  if (error) {
    return (
      <View style={sharedStyles.container}>
        <Text style={sharedStyles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      <Text style={sharedStyles.heading}>{t('wallet.title')}</Text>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.label}>{t('wallet.address')}:</Text>
        <Text style={sharedStyles.text}>{addr}</Text>
        <Text style={sharedStyles.label}>{t('wallet.network')}:</Text>
        <Text style={sharedStyles.text}>{client?.config.network}</Text>
      </View>
    </View>
  );
}
