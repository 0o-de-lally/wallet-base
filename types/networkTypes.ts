export enum ChainName {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCAL = 'local',
  CUSTOM = 'custom'
}

export interface NetworkConfig {
  type: ChainName;
  rpcUrl: string;
  chainId: number;
}

export interface NetworkConfigFile {
  activeNetwork: NetworkConfig;
  lastUpdated: string;
}
