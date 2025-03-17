import { TESTNET_CONFIG } from '@/util/networkSettings';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ALICE_MNEM, LibraWallet, Network } from 'open-libra-sdk';

interface WalletState {
  walletConfig: LibraWallet;
  blockHeight: string;
  error: string | null;
}

const initialState: WalletState = {
  walletConfig: new LibraWallet(ALICE_MNEM, Network.MAINNET, TESTNET_CONFIG.rpcUrl),
  blockHeight: 'Loading...',
  error: null,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<{ wallet: LibraWallet }>) => {
      state.walletConfig = action.payload.wallet;
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

export default walletSlice.reducer;
