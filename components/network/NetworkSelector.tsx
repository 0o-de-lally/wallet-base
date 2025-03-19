import { View, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { CustomText } from '../CustomText';
import { Network } from 'open-libra-sdk';
import { RootState } from '../../store';
import { NetworkConfigGenerator } from '../../util/networkSettings';
import { setNetworkConfig } from '@/store/slices/networkSlice';
import { sharedStyles } from '@/styles/shared';

export default function NetworkSelector() {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state: RootState) => state.network);
  const networks = Object.values(Network);

  const handleNetworkSelect = (network: Network) => {
    const config = NetworkConfigGenerator.generateConfig(network);
    dispatch(setNetworkConfig(config));
  };

  return (
    <View>
      <CustomText style={sharedStyles.heading}>Select Network</CustomText>
      <View style={sharedStyles.row}>
        {networks.map((network) => (
          <TouchableOpacity
            key={network}
            style={[
              sharedStyles.button,
              currentNetwork.type === network && { backgroundColor: '#004999' }
            ]}
            onPress={() => handleNetworkSelect(network)}
          >
            <CustomText style={sharedStyles.buttonText}>{network}</CustomText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
