import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ActionButton } from '../common/ActionButton';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, authenticate, isLoading } = useAuth();

  // Attempt authentication when component mounts
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      authenticate();
    }
  }, [isAuthenticated, authenticate, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5e35b1" />
        <Text style={styles.text}>Checking device security...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication Required</Text>
        <Text style={styles.text}>
          Please authenticate to access your wallet.
        </Text>
        <ActionButton
          text="Authenticate"
          onPress={authenticate}
          style={styles.button}
          accessibilityLabel="Authenticate with device security"
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#5e35b1',
  },
});
