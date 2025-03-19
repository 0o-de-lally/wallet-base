import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CustomText } from '../CustomText';
import { Network } from 'open-libra-sdk';
import { observer } from '@legendapp/state/react';
import { networkStore$, updateNetwork } from '@/util/networkSettings';
import { sharedStyles } from '@/styles/shared';

export default observer(function NetworkSelector() {
  const handleNetworkSelect = (network: Network) => {
    updateNetwork(network);
  };

  const currentNetwork = networkStore$.activeNetwork.get();
  const networks = [Network.MAINNET, Network.TESTNET, Network.LOCAL];

  return (
    <View style={{ gap: 10 }}>
      <CustomText style={sharedStyles.heading}>Select Network</CustomText>
      <View>
        <CustomText>Current Network: {currentNetwork.type}</CustomText>
        <CustomText style={{ fontSize: 12, color: '#666' }}>
          RPC URL: {currentNetwork.rpcUrl}
        </CustomText>
      </View>
      <View style={{
        borderWidth: 1,
        borderColor: '#004999',
        borderRadius: 4,
        marginTop: 5
      }}>
        <Picker
          selectedValue={currentNetwork.type}
          onValueChange={handleNetworkSelect}
          style={{ color: '#fff' }}
        >
          {networks.map((network) => (
            <Picker.Item
              key={network}
              label={network}
              value={network}
              color={currentNetwork.type === network ? '#004999' : undefined}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
});
