import { createContext, useContext } from 'react';
import { ChainName, NetworkConfig } from '@/types/networkTypes';

interface AppContextType {
  chain_name: ChainName;
  network_config: NetworkConfig;
}

const AppContext = createContext<AppContextType>({
  chain_name: ChainName.MAINNET,
  network_config: {} as NetworkConfig
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContext.Provider');
  }
  return context;
};

export { AppContext };
export default AppContext;
