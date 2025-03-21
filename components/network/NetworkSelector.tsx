import { View, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CustomText } from '../CustomText';
import { Network } from 'open-libra-sdk';
import { observer } from '@legendapp/state/react';
import { networkStore$, updateNetwork } from '@/util/networkSettings';
import { sharedStyles } from '@/styles/shared';
import { ErrorLogger } from '@/util/errorLogging';
import { useState } from 'react';

export default observer(function NetworkSelector() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNetworkSelect = async (network: Network) => {
    setIsLoading(true);
    setError(null);
    console.log('Switching to network:', network);

    try {
      await updateNetwork(network);
      console.log('Network switch successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to network';
      setError(errorMessage);
      ErrorLogger.logError('NetworkSelector: Failed to switch network', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentNetwork = networkStore$.activeNetwork.get();
  console.log('Current network:', currentNetwork);
  const networks = [Network.MAINNET, Network.TESTNET, Network.LOCAL];

  const getNetworkName = (network: Network) => {
    switch (network) {
      case Network.MAINNET:
        return 'Mainnet';
      case Network.TESTNET:
        return 'Testnet';
      case Network.LOCAL:
        return 'Local Network';
      default:
        return network;
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <CustomText style={sharedStyles.heading}>Select Network</CustomText>
      {error && (
        <CustomText style={{ color: 'red', fontSize: 12 }}>{error}</CustomText>
      )}
      <View>
        <CustomText>Current Network: {getNetworkName(currentNetwork.type)}</CustomText>
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
        {isLoading ? (
          <ActivityIndicator color="#004999" />
        ) : (
          <Picker
            selectedValue={currentNetwork.type}
            onValueChange={handleNetworkSelect}
            style={{ color: '#000' }}
          >
            {networks.map((network) => (
              <Picker.Item
                key={network}
                label={getNetworkName(network)}
                value={network}
                color={currentNetwork.type === network ? '#004999' : undefined}
              />
            ))}
          </Picker>
        )}
      </View>
    </View>
  );
});
