import { NetworkConfigGenerator } from '@/util/networkSettings';
import { ChainName, NetworkConfig } from '../../types/networkTypes';
import { createContext, useContext } from 'react';

export interface AppContextType {
  chain_name: ChainName;
  network_config: NetworkConfig;
}

export const AppContext = createContext<AppContextType>({
  chain_name: ChainName.MAINNET,
  network_config: NetworkConfigGenerator.generateConfig(ChainName.MAINNET)
});

export const useAppContext = () => useContext(AppContext);
