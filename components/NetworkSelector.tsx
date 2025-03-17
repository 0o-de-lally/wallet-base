import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { CustomText } from './CustomText';
import { ChainName } from '../types/networkTypes';
import { RootState, setNetworkConfig } from '../store';
import { NetworkConfigGenerator } from '../util/networkSettings';

export default function NetworkSelector() {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state: RootState) => state.network);

  const networks = Object.values(ChainName);

  const handleNetworkSelect = (chainName: ChainName) => {
    const config = NetworkConfigGenerator.generateConfig(chainName);
    dispatch(setNetworkConfig(config));
  };

  return (
    <View style={styles.container}>
      {networks.map((chainName) => (
        <TouchableOpacity
          key={chainName}
          style={[
            styles.networkButton,
            currentNetwork.type === chainName && styles.selectedNetwork
          ]}
          onPress={() => handleNetworkSelect(chainName)}
        >
          <CustomText style={styles.networkText}>{chainName}</CustomText>
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
