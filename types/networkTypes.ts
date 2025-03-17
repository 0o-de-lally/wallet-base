import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum ChainName {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCAL = 'local',
  CUSTOM = 'custom'
}

export interface NetworkConfig {
  type: ChainName;
  rpcUrl: string;
  chainId: number;
}

export interface NetworkConfigFile {
  activeNetwork: NetworkConfig;
  lastUpdated: string;
}

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
      state.type = action.payload.type;
      state.chainId = action.payload.chainId;
      state.rpcUrl = action.payload.rpcUrl;
    }
  }
});

export const { setNetworkConfig } = networkSlice.actions;
export default networkSlice.reducer;
