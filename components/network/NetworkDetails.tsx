import { View } from 'react-native';
import { observer } from '@legendapp/state/react';
import { CustomText } from '../CustomText';
import { networkStore$ } from '@/util/networkSettings';
import { sharedStyles } from '@/styles/shared';

export default observer(function NetworkDetails() {
  const networkConfig = networkStore$.activeNetwork.get();

  return (
    <View>
      <CustomText style={sharedStyles.heading}>Network Details</CustomText>
      <CustomText style={sharedStyles.text}>Network: {networkConfig.type}</CustomText>
      <CustomText style={sharedStyles.text}>Chain ID: {networkConfig.chainId}</CustomText>
      <CustomText style={sharedStyles.label}>RPC URL: {networkConfig.rpcUrl}</CustomText>
    </View>
  );
});
