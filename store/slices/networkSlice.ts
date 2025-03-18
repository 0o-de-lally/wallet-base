import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NetworkConfig, NetworkConfigFile } from '../../types/networkTypes';
import { saveNetworkConfig } from '../../util/fileSystem';
import { Network } from 'open-libra-sdk';
import { initClient } from '@/util/init';

const initialState: NetworkConfig = {
  type: Network.MAINNET,
  chainId: 1,
  rpcUrl: ''
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkConfig: (state, action: PayloadAction<NetworkConfig>) => {
      const { type, chainId, rpcUrl } = action.payload;
      state.type = type;
      state.chainId = chainId;
      state.rpcUrl = rpcUrl;

      const networkConfigFile: NetworkConfigFile = {
        activeNetwork: action.payload,
        lastUpdated: new Date().toISOString()
      };
      saveNetworkConfig(networkConfigFile).catch(console.error);

      initClient(type, rpcUrl).then(() => {
        console.log('Client initialized with network:', type);
      }).catch(console.error);
    }
  }
});

export const { setNetworkConfig } = networkSlice.actions;
export default networkSlice.reducer;
