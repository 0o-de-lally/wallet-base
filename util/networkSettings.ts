import { ChainName, NetworkConfig, NetworkConfigFile } from '../types/networkTypes';
import { loadNetworkConfig, saveNetworkConfig } from './fileSystem';

export class NetworkConfigGenerator {
  private static instance: NetworkConfigGenerator;

  private constructor(
    private readonly _chainType: ChainName = ChainName.MAINNET,
    private readonly _rpcUrl: string = '',
    private readonly _chainId: number = 1
  ) {}

  static getInstance(): NetworkConfigGenerator {
    if (!NetworkConfigGenerator.instance) {
      NetworkConfigGenerator.instance = new NetworkConfigGenerator();
    }
    return NetworkConfigGenerator.instance;
  }

  static createCustomConfig(
    rpcUrl: string,
    chainId: number
  ): NetworkConfigGenerator {
    return new NetworkConfigGenerator(ChainName.CUSTOM, rpcUrl, chainId);
  }

  static async saveConfig(config: NetworkConfig): Promise<void> {
    const networkConfigFile: NetworkConfigFile = {
      activeNetwork: config,
      lastUpdated: new Date().toISOString()
    };
    await saveNetworkConfig(networkConfigFile);
  }

  static generateConfig(type: ChainName, customConfig?: NetworkConfigGenerator): NetworkConfig {
    switch (type) {
      case ChainName.MAINNET:
        return {
          type: ChainName.MAINNET,
          rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
          chainId: 1
        };
      case ChainName.TESTNET:
        return {
          type: ChainName.TESTNET,
          rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
          chainId: 11155111
        };
      case ChainName.LOCAL:
        return {
          type: ChainName.LOCAL,
          rpcUrl: 'http://127.0.0.1:8545',
          chainId: 1337
        };
      case ChainName.CUSTOM:
        if (!customConfig) {
          throw new Error('Custom config is required for custom network type');
        }
        return {
          type: ChainName.CUSTOM,
          rpcUrl: customConfig.rpcUrl,
          chainId: customConfig.chainId
        };
    }
  }

  // Getters for private fields
  get chainType(): ChainName { return this._chainType; }
  get rpcUrl(): string { return this._rpcUrl; }
  get chainId(): number { return this._chainId; }

  async initializeNetworkConfig(type: ChainName): Promise<NetworkConfigFile> {
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

  async updateNetwork(type: ChainName, customConfig?: NetworkConfigGenerator): Promise<void> {
    const newConfig: NetworkConfigFile = {
      activeNetwork: NetworkConfigGenerator.generateConfig(type, customConfig),
      lastUpdated: new Date().toISOString()
    };

    await saveNetworkConfig(newConfig);
  }
}
