import { View, StyleSheet } from 'react-native';
import NetworkSelector from './NetworkSelector';
import NetworkDetails from './NetworkDetails';

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
