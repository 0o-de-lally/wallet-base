import { configureStore } from '@reduxjs/toolkit';
import networkReducer from './slices/networkSlice';
import walletReducer from './slices/walletSlice';

export const store = configureStore({
  reducer: {
    network: networkReducer,
    wallet: walletReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions for convenience
export { setNetworkConfig } from './slices/networkSlice';
export { setWallet, setBlockHeight, setError } from './slices/walletSlice';
