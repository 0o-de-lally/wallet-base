import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { CustomText } from './CustomText';
import { ChainName, NetworkConfig, setNetworkConfig } from '../types/networkTypes';
import { RootState } from '../store/store';

export default function NetworkSelector() {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state: RootState) => state.network);

  const networks: NetworkConfig[] = [
    { type: ChainName.MAINNET, chainId: 1, rpcUrl: 'https://eth-mainnet.api.com' },
    { type: ChainName.TESTNET, chainId: 5, rpcUrl: 'https://eth-goerli.api.com' },
    { type: ChainName.LOCAL, chainId: 1337, rpcUrl: 'http://localhost:8545' }
  ];

  const handleNetworkSelect = (network: NetworkConfig) => {
    dispatch(setNetworkConfig(network));
  };

  return (
    <View style={styles.container}>
      {networks.map((network) => (
        <TouchableOpacity
          key={network.type}
          style={[
            styles.networkButton,
            currentNetwork.type === network.type && styles.selectedNetwork
          ]}
          onPress={() => handleNetworkSelect(network)}
        >
          <CustomText style={styles.networkText}>{network.type}</CustomText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  networkButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedNetwork: {
    backgroundColor: '#007AFF',
  },
  networkText: {
    textTransform: 'capitalize',
  },
});
