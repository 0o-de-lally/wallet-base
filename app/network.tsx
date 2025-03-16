import { View, Text, StyleSheet } from 'react-native';
import NetworkSelector from '../components/NetworkSelector';
import NetworkDetails from '../components/NetworkDetails';
import { useReducer } from 'react';

export default function NetworkScreen() {

  return (
    <View style={styles.container}>
      <NetworkSelector />
      <NetworkDetails />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});
