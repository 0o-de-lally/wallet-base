import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { CustomText } from './CustomText';
import { RootState } from '../store';

export const LedgerIndex = () => {
  const network = useSelector((state: RootState) => state.network);
  const { blockHeight, error } = useSelector((state: RootState) => state.wallet);

  return (
    <View>
      <CustomText>Ledger Information</CustomText>
      <CustomText>Active RPC URL: {network.rpcUrl}</CustomText>
      <CustomText>Block Height: {error || blockHeight}</CustomText>
    </View>
  );
};

export default LedgerIndex;
