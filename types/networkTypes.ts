import { Network } from "open-libra-sdk";

export interface NetworkConfig {
  type: Network;
  rpcUrl: string;
  chainId: number;
}

export interface NetworkConfigFile {
  activeNetwork: NetworkConfig;
  lastUpdated: string;
}
