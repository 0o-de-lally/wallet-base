import { configureStore } from '@reduxjs/toolkit';
import networkReducer from './slices/networkSlice';
import walletReducer, { setWallet, setError } from './slices/walletSlice';
import { ALICE_MNEM, LibraWallet, Network } from 'open-libra-sdk';

export const store = configureStore({
  reducer: {
    network: networkReducer,
    wallet: walletReducer,
  },
});

export const initializeWallet = () => {
  try {
    const wallet = new LibraWallet(ALICE_MNEM, Network.TESTNET);
    store.dispatch(setWallet({ wallet }));
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    store.dispatch(setError('Failed to initialize wallet'));
  }
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions for convenience
export { setNetworkConfig } from './slices/networkSlice';
export { setWallet, setBlockHeight, setError } from './slices/walletSlice';
