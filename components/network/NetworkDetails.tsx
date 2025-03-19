import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { CustomText } from '../CustomText';
import { RootState } from '../../store';
import { sharedStyles } from '@/styles/shared';

export default function NetworkDetails() {
  const networkConfig = useSelector((state: RootState) => state.network);

  return (
    <View>
      <CustomText style={sharedStyles.heading}>Network Details</CustomText>
      <CustomText style={sharedStyles.text}>Network: {networkConfig.type}</CustomText>
      <CustomText style={sharedStyles.text}>Chain ID: {networkConfig.chainId}</CustomText>
      <CustomText style={sharedStyles.label}>RPC URL: {networkConfig.rpcUrl}</CustomText>
    </View>
  );
}
