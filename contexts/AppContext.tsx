import { createContext, useContext } from 'react';
import { NetworkConfig } from '../types/networkTypes';
import { NetworkConfigGenerator } from '../util/networkSettings';
import { ChainName } from '../types/networkTypes';

const NetworkContext = createContext<NetworkConfig>(NetworkConfigGenerator.generateConfig(ChainName.MAINNET));

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
