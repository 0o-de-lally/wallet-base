import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';
import { useSelector } from 'react-redux';
import { CustomText } from './CustomText';
import { RootState } from '../store';

export const LedgerIndex = () => {
  const network = useSelector((state: RootState) => state.network);
  const wallet = useSelector((state: RootState) => state.wallet);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // const fetchLedgerInfo = async () => {
  //   try {
  //     const info = await wallet.walletConfig.client?.getLedgerInfo();
  //     setBlockHeight(Number(info?.block_height) || null);
  //     setError(null);
  //   } catch (err) {
  //     console.error(err);
  //     setError('Failed to fetch block height');
  //     setBlockHeight(null);
  //   }
  // };

  // useEffect(() => {
  //   fetchLedgerInfo();
  // }, [network.rpcUrl]); // Refetch when network changes

  return (
    <View>
      <CustomText>Ledger Information</CustomText>
      <CustomText>Active RPC URL: {network.rpcUrl}</CustomText>
      <CustomText>Block Height: {error || blockHeight || 'Loading...'}</CustomText>
      {/* <Button title="Refresh Ledger Info" onPress={fetchLedgerInfo} /> */}
    </View>
  );
};

export default LedgerIndex;
