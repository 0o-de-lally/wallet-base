import { createContext, useContext, useReducer, Dispatch } from 'react';
import { ChainName, NetworkConfig } from '@/types/networkTypes';

// Action Types
enum AppAction {
  Update = "update",
  Create = "create",
}
interface AppGlobalState {
  network_config: NetworkConfig
}

export const appReducer = (state: AppGlobalState, action: AppAction): AppGlobalState => {
  switch (action) {
    case AppAction.Update:
      console.log('Updating state');
      return state;
    case AppAction.Create:
      console.log('Creating state');
      return state;
    default: {
      throw Error('Unknown action: ' + action);
    }
  }
};
