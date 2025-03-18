import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { CustomText } from '../CustomText';
import { Network } from 'open-libra-sdk';
import { RootState } from '../../store';
import { NetworkConfigGenerator } from '../../util/networkSettings';
import { setNetworkConfig } from '@/store/slices/networkSlice';

export default function NetworkSelector() {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state: RootState) => state.network);

  const networks = Object.values(Network);

  const handleNetworkSelect = (network: Network) => {
    const config = NetworkConfigGenerator.generateConfig(network);
    dispatch(setNetworkConfig(config));
  };

  return (
    <View style={styles.container}>
      {networks.map((network) => (
        <TouchableOpacity
          key={network}
          style={[
            styles.networkButton,
            currentNetwork.type === network && styles.selectedNetwork
          ]}
          onPress={() => handleNetworkSelect(network)}
        >
          <CustomText style={styles.networkText}>{network}</CustomText>
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
