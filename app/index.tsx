import '@/util/polyfills';
import { StyleSheet, ScrollView, SafeAreaView, View } from 'react-native';
import NetworkScreen from '../components/network/NetworkScreen';
import LedgerIndex from '@/components/LedgerIndex';
import Boot from './boot';
import { AccountList } from '@/components/account/AccountList';

function AppContent() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Boot />
        </View>

        <View style={styles.section}>
          <AccountList />
        </View>

        <View style={styles.section}>
          <LedgerIndex />
        </View>

        <View style={styles.section}>
          <NetworkScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <AppContent />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60, // Add padding for status bar
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 16,
  }
});
