import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName, NetworkConfig, NetworkConfigFile } from '../../types/networkTypes';
import { saveNetworkConfig } from '../../util/fileSystem';

const initialState: NetworkConfig = {
  type: ChainName.MAINNET,
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
    }
  }
});

export const { setNetworkConfig } = networkSlice.actions;
export default networkSlice.reducer;
