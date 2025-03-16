import * as FileSystem from 'expo-file-system';
import { NetworkConfigGenerator } from '../networkSettings';
import { ChainName, NetworkConfigFile } from '../../types/networkTypes';
import { getConfigFilePath, ensureConfigDirectory } from '../fileSystem';

describe('NetworkConfigGenerator', () => {
  let configPath: string;

  beforeAll(async () => {
    await ensureConfigDirectory();
    configPath = await getConfigFilePath();
  });

  beforeEach(async () => {
    // Clean up any existing config file
    const fileInfo = await FileSystem.getInfoAsync(configPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(configPath);
    }
  });

  it('should initialize with mainnet config when no config exists', async () => {

    // Verify file was created
    const fileInfo = await FileSystem.getInfoAsync(configPath);
    expect(fileInfo.exists).toBe(true);

    try {
      // Read and verify content
      const savedContent = await FileSystem.readAsStringAsync(configPath);
      expect(savedContent).toBeTruthy();

      const savedConfig = JSON.parse(savedContent) as NetworkConfigFile;
      expect(savedConfig).toBeDefined();
      expect(savedConfig.activeNetwork).toBeDefined();
      expect(savedConfig.activeNetwork.type).toBe(ChainName.MAINNET);
      expect(savedConfig.activeNetwork.chainId).toBe(1);
      expect(savedConfig.activeNetwork.rpcUrl).toBe('https://eth-mainnet.g.alchemy.com/v2/your-api-key');
    } catch (error) {
      fail(`Failed to read or parse config file: ${error}`);
    }
  });

  it('should create and update custom network config', async () => {
    // Setup
    const customRpc = 'https://custom-rpc';
    const customChainId = 1234;

    // Execute
    const generator = NetworkConfigGenerator.getInstance();
    const customConfig = NetworkConfigGenerator.createCustomConfig(customRpc, customChainId);
    await generator.updateNetwork(ChainName.CUSTOM, customConfig);

    try {
      // Read and verify content
      const savedContent = await FileSystem.readAsStringAsync(configPath);
      expect(savedContent).toBeTruthy();

      const savedConfig = JSON.parse(savedContent) as NetworkConfigFile;
      expect(savedConfig).toBeDefined();
      expect(savedConfig.activeNetwork).toBeDefined();
      expect(savedConfig.activeNetwork.type).toBe(ChainName.CUSTOM);
      expect(savedConfig.activeNetwork.rpcUrl).toBe(customRpc);
      expect(savedConfig.activeNetwork.chainId).toBe(customChainId);
    } catch (error) {
      fail(`Failed to read or parse config file: ${error}`);
    }
  });
});
