import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { observer } from '@legendapp/state/react';
import { CustomText } from './CustomText';
import { client } from '@/util/init';
import { sharedStyles } from '@/styles/shared';
import { networkStore$ } from '@/util/networkSettings';

export const LedgerIndex = observer(() => {
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const network = networkStore$.activeNetwork.get();

  const fetchLedgerInfo = async () => {
    try {
      if (!client) {
        throw new Error('Client not initialized');
      }
      const info = await client.getLedgerInfo();
      console.log('Ledger info:', info);
      setBlockHeight(Number(info?.block_height) || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch block height');
      setBlockHeight(null);
    }
  };

  useEffect(() => {
    fetchLedgerInfo();
  }, [network]);

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.card}>
        <CustomText style={sharedStyles.heading}>Ledger Information</CustomText>
        <CustomText style={sharedStyles.text}>
          Active RPC URL: {network.rpcUrl}
        </CustomText>
        <CustomText style={sharedStyles.text}>
          Block Height: {error || blockHeight || 'Loading...'}
        </CustomText>
      </View>
    </View>
  );
});

export default LedgerIndex;
