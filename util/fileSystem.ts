import { RuntimePlatform, getPlatform } from './platform';
import { StorageSystem } from './storage/types';
import { MobileStorage } from './storage/mobile';
import { WebStorage } from './storage/web';
import { NetworkConfigFile } from '../types/networkTypes';

const CONFIG_FILENAME = 'network-config.json';

function getStorage(): StorageSystem {
  const platform = getPlatform();
  switch (platform) {
    case RuntimePlatform.Mobile:
      return new MobileStorage();
    case RuntimePlatform.Web:
      return new WebStorage();
    case RuntimePlatform.Desktop:
      return new MobileStorage(); // For now, using mobile implementation for desktop
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

const storage = getStorage();

function getConfigDir(): string {
  return `${storage.getDocumentDirectory()}configs/`;
}

export async function ensureConfigDirectory(): Promise<void> {
  try {
    const configDir = getConfigDir();
    const exists = await storage.exists(configDir);
    if (!exists) {
      await storage.makeDirectory(configDir);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to ensure config directory:', errorMessage);
    throw error;
  }
}

export async function getConfigFilePath(): Promise<string> {
  await ensureConfigDirectory();
  return getConfigDir() + CONFIG_FILENAME;
}

export async function saveObjectToConfigPath(filename: string, obj: any): Promise<string> {
  const configDir = getConfigDir();
  const filePath = `${configDir}${filename}`;
  await storage.writeFile(filePath, JSON.stringify(obj, null, 2));
  return filePath;
}

export async function deleteConfigFile(filename: string): Promise<void> {
  try {
    const configDir = getConfigDir();
    const filePath = `${configDir}${filename}`;
    const exists = await storage.exists(filePath);

    if (exists) {
      await storage.deleteFile(filePath);
    }
  } catch (error) {
    console.error('Failed to delete config file:', error);
    throw error;
  }
}

export async function readObjectFromConfigPath<T>(filename: string): Promise<T | null> {
  try {
    const configDir = getConfigDir();
    const filePath = `${configDir}${filename}`;
    const exists = await storage.exists(filePath);

    if (!exists) {
      return null;
    }

    const content = await storage.readFile(filePath);
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to read object from config path:', error);
    throw error;
  }
}

export async function saveNetworkConfig(config: NetworkConfigFile): Promise<void> {
  const filePath = await getConfigFilePath();
  await storage.writeFile(filePath, JSON.stringify(config, null, 2));
}

export async function loadNetworkConfig(): Promise<NetworkConfigFile | null> {
  const filePath = await getConfigFilePath();
  const exists = await storage.exists(filePath);

  if (!exists) {
    return null;
  }

  const content = await storage.readFile(filePath);
  return JSON.parse(content) as NetworkConfigFile;
}
