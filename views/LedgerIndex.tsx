import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { NetworkConfig } from '../types/networkTypes';
import { CustomText } from '../components/CustomText';
import { ALICE_MNEM, LibraWallet, Network } from 'open-libra-sdk'

export const LedgerIndex: React.FC = () => {
  const network = useSelector((state: { network: NetworkConfig }) => state.network);
  const wallet = new LibraWallet(ALICE_MNEM, Network.TESTNET, network.rpcUrl, null, null);
  const [blockHeight, setBlockHeight] = useState<string>('Loading...');

  useEffect(() => {
    const fetchLedgerInfo = async () => {
      try {
        const ledgerInfo = await wallet.client?.getLedgerInfo();
        setBlockHeight(ledgerInfo?.block_height.toString() ?? 'Not available');
        console.log("block height:", ledgerInfo?.block_height);
      } catch (error) {
        console.error('Error fetching ledger info:', error);
        setBlockHeight('Error fetching block height');
      }
    };

    fetchLedgerInfo();
  }, [wallet]);

  return (
    <View>
      <CustomText>Ledger Information</CustomText>
      <CustomText>Active RPC URL: {network.rpcUrl}</CustomText>
      <CustomText>Block Height: {blockHeight}</CustomText>
    </View>
  );
};

export default LedgerIndex;
