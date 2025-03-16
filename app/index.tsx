import { StyleSheet, View } from 'react-native';
import NetworkScreen from './network';
import { AppContext } from './context/AppContext';
import { ChainName } from '@/types/networkTypes';
import { NetworkConfigGenerator } from '@/util/networkSettings';
import { CustomText } from '../components/CustomText';

export default function HomeScreen() {
  return (
    <AppContext.Provider value={{
      chain_name: ChainName.MAINNET,
      network_config: NetworkConfigGenerator.generateConfig(ChainName.MAINNET)
    }}>
      <View style={styles.container}>
        <CustomText>Welcome!</CustomText>
        <NetworkScreen />
      </View>
    </AppContext.Provider>
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
