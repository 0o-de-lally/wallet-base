import '@/util/polyfills';
import { StyleSheet, View } from 'react-native';
import NetworkScreen from '../components/network/NetworkScreen';
import { Provider } from 'react-redux';
import LedgerIndex from '@/components/LedgerIndex';
import { store } from '@/store';
import Boot from './boot';
import { TaskList } from '@/components/TaskList/TaskList';

function AppContent() {

  return (
    <View style={styles.container}>
      <Boot />
      <TaskList />

      <LedgerIndex />
      <NetworkScreen />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
