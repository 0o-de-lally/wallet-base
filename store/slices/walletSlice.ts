import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LibraWallet, Network } from 'open-libra-sdk';

interface WalletState {
  walletConfig: {
    mnemonic: string;
    network: Network;
    rpcUrl: string;
  } | null;
  blockHeight: string;
  error: string | null;
}

const initialState: WalletState = {
  walletConfig: null,
  blockHeight: 'Loading...',
  error: null,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<{ mnemonic: string; network: Network; rpcUrl: string }>) => {
      state.walletConfig = action.payload;
      state.error = null;
    },
    setBlockHeight: (state, action: PayloadAction<string>) => {
      state.blockHeight = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setWallet, setBlockHeight, setError } = walletSlice.actions;

// Helper function to create wallet instance from state
export const getWalletFromState = (state: WalletState): LibraWallet | null => {
  if (!state.walletConfig) return null;
  const { mnemonic, network, rpcUrl } = state.walletConfig;
  return new LibraWallet(mnemonic, network, rpcUrl);
};

export default walletSlice.reducer;
