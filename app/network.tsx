import { View, Text, StyleSheet } from 'react-native';
import NetworkSelector from '../components/NetworkSelector';
import NetworkDetails from '../components/NetworkDetails';
import { useAppContext } from './context/AppContext';

export default function NetworkScreen() {
  const { network_config } = useAppContext();

  if (!network_config) {
    return (
      <View style={styles.container}>
        <Text>Loading network configuration...</Text>
      </View>
    );
  }

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
