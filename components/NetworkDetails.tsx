import { useReducer } from 'react';
import { View, StyleSheet } from 'react-native';
import { appReducer } from '../app/context/AppContext';
import { CustomText } from './CustomText';

export default function NetworkDetails() {
  const [state, _dispatch] = useReducer(appReducer, {});


  return (
    <View style={styles.container}>
      <CustomText>Network: {state.network_config.type}</CustomText>
      <CustomText>Chain ID: {state.network_config.chainId}</CustomText>
      <CustomText>RPC URL: {state.network_config.rpcUrl}</CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
});
