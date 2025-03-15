export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  blockExplorer?: string;
}

export interface NetworkConfigFile {
  networks: NetworkConfig[];
  lastUpdated: string;
}
