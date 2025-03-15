import { NetworkConfig, NetworkConfigFile } from '../types/networkTypes';
import { loadNetworkConfig, saveNetworkConfig } from './fileSystem';

const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    chainId: 1,
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io'
  }
];

export async function initializeNetworkConfig(): Promise<NetworkConfigFile> {
  const existingConfig = await loadNetworkConfig();

  if (existingConfig) {
    return existingConfig;
  }

  const newConfig: NetworkConfigFile = {
    networks: DEFAULT_NETWORKS,
    lastUpdated: new Date().toISOString()
  };

  await saveNetworkConfig(newConfig);
  return newConfig;
}

export async function updateNetworkConfig(networks: NetworkConfig[]): Promise<void> {
  const config: NetworkConfigFile = {
    networks,
    lastUpdated: new Date().toISOString()
  };

  await saveNetworkConfig(config);
}
