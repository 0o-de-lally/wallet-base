import '@/util/polyfills';
import '@/i18n';  // Import i18n configuration
import { StyleSheet, FlatList, SafeAreaView, View, Text } from 'react-native';
import NetworkScreen from '../components/network/NetworkScreen';
import LedgerIndex from '@/components/LedgerIndex';
import Boot from './boot';
import { AccountList } from '@/components/account/AccountList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setupGlobalErrorHandler } from '@/util/errorLogging';
import Debug from './debug';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getStorageMechanism } from '../src/store';

// Initialize global error handling
setupGlobalErrorHandler();

function AppContent() {
  const [storageMechanism, setStorageMechanism] = useState<'SecureStore' | 'Memory' | 'None' | 'Loading'>('Loading');

  useEffect(() => {
    async function checkStorage() {
      const mechanism = await getStorageMechanism();
      setStorageMechanism(mechanism);
    }

    checkStorage();
  }, []);

  // Get the color and message based on the storage mechanism
  const getStorageInfo = () => {
    switch (storageMechanism) {
      case 'SecureStore':
        return {
          color: '#4CAF50',  // Green
          message: 'Using secure storage - your data is encrypted'
        };
      case 'Memory':
        return {
          color: '#FF9800',  // Orange/Warning
          message: 'Using in-memory storage - data will NOT persist when app is closed!'
        };
      case 'None':
        return {
          color: '#F44336',  // Red/Error
          message: 'No storage mechanism available - data cannot be saved!'
        };
      default:
        return {
          color: '#2196F3',  // Blue/Info
          message: 'Checking storage mechanism...'
        };
    }
  };

  const { color, message } = getStorageInfo();

  // Define sections to render in our main FlatList
  const sections = [
    { id: 'boot', component: <Boot /> },
    { id: 'accounts', component: <AccountList /> },
    { id: 'ledger', component: <LedgerIndex /> },
    { id: 'network', component: <NetworkScreen /> },
    { id: 'debug', component: <Debug /> }
  ];

  // Create header component containing banner and language switcher
  const HeaderComponent = () => (
    <>
      <View style={[styles.banner, { backgroundColor: color }]}>
        <Text style={styles.bannerText}>
          Storage: {storageMechanism} - {message}
        </Text>
      </View>
      <View style={styles.headerSection}>
        <LanguageSwitcher />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={<HeaderComponent />}
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.section}>
            {item.component}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 16,
  },
  headerSection: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  banner: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
