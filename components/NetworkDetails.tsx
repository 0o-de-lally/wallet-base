import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { CustomText } from './CustomText';
import { RootState } from '../store/store';

export default function NetworkDetails() {
  const networkConfig = useSelector((state: RootState) => state.network);

  return (
    <View style={styles.container}>
      <CustomText>Network: {networkConfig.type}</CustomText>
      <CustomText>Chain ID: {networkConfig.chainId}</CustomText>
      <CustomText>RPC URL: {networkConfig.rpcUrl}</CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
});
