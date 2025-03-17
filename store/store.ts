import { configureStore } from '@reduxjs/toolkit';
import networkReducer from '../types/networkTypes';

export const store = configureStore({
  reducer: {
    network: networkReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
