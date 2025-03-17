import { Network } from 'open-libra-sdk';
import { NetworkConfig, NetworkConfigFile } from '../types/networkTypes';
import { loadNetworkConfig, saveNetworkConfig } from './fileSystem';

export const MAINNET_CONFIG: NetworkConfig = {
  type: Network.MAINNET,
  rpcUrl: 'https://rpc.scan.openlibra.world/v1',
  chainId: 1
};

export const TESTNET_CONFIG: NetworkConfig = {
  type: Network.TESTNET,
  rpcUrl: 'https://testnet.openlibra.io/v1',
  chainId: 2
};

export const LOCAL_CONFIG: NetworkConfig = {
  type: Network.LOCAL,
  rpcUrl: 'http://127.0.0.1:8380',
  chainId: 2
};

export class NetworkConfigGenerator {
  private static instance: NetworkConfigGenerator;

  private constructor(
    private readonly _chainType: Network = Network.MAINNET,
    private readonly _rpcUrl: string = '',
    private readonly _chainId: number = 1
  ) {}

  static getInstance(): NetworkConfigGenerator {
    if (!NetworkConfigGenerator.instance) {
      NetworkConfigGenerator.instance = new NetworkConfigGenerator();
    }
    return NetworkConfigGenerator.instance;
  }

  static async saveConfig(config: NetworkConfig): Promise<void> {
    const networkConfigFile: NetworkConfigFile = {
      activeNetwork: config,
      lastUpdated: new Date().toISOString()
    };
    await saveNetworkConfig(networkConfigFile);
  }

  static generateConfig(type: Network, customConfig?: NetworkConfigGenerator): NetworkConfig {
    switch (type) {
      case Network.MAINNET:
        return MAINNET_CONFIG;
      case Network.TESTNET:
        return TESTNET_CONFIG;
      case Network.LOCAL:
        return LOCAL_CONFIG;
      default:
        return MAINNET_CONFIG;
    }
  }

  // Getters for private fields
  get chainType(): Network { return this._chainType; }
  get rpcUrl(): string { return this._rpcUrl; }
  get chainId(): number { return this._chainId; }

  async initializeNetworkConfig(type: Network): Promise<NetworkConfigFile> {
    const existingConfig = await loadNetworkConfig();

    if (existingConfig) {
      return existingConfig;
    }

    const newConfig: NetworkConfigFile = {
      activeNetwork: NetworkConfigGenerator.generateConfig(type),
      lastUpdated: new Date().toISOString()
    };

    await saveNetworkConfig(newConfig);
    return newConfig;
  }

  async updateNetwork(type: Network, customConfig?: NetworkConfigGenerator): Promise<void> {
    const newConfig: NetworkConfigFile = {
      activeNetwork: NetworkConfigGenerator.generateConfig(type, customConfig),
      lastUpdated: new Date().toISOString()
    };

    await saveNetworkConfig(newConfig);
  }
}
