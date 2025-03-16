import * as FileSystem from 'expo-file-system';
import { NetworkConfigFile } from '../types/networkTypes';

const CONFIG_FILENAME = 'network-config.json';

function getConfigDir(): string {
  if (!FileSystem.documentDirectory) {
    return 'temppath/configs/';
  }
  return `${FileSystem.documentDirectory}configs/`;
}

export async function ensureConfigDirectory(): Promise<void> {
  try {
    const configDir = getConfigDir();
    const dirInfo = await FileSystem.getInfoAsync(configDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(configDir, { intermediates: true });
    }
  } catch (error) {
    console.error('Failed to ensure config directory:', error);
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
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(obj, null, 2));
  return filePath
}

export async function deleteConfigFile(filename: string): Promise<void> {
  try {
    const configDir = getConfigDir();
    const filePath = `${configDir}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
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
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (!fileInfo.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to read object from config path:', error);
    throw error;
  }
}

export async function saveNetworkConfig(config: NetworkConfigFile): Promise<void> {
  const filePath = await getConfigFilePath();
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(config, null, 2));
}

export async function loadNetworkConfig(): Promise<NetworkConfigFile | null> {
  const filePath = await getConfigFilePath();
  const fileInfo = await FileSystem.getInfoAsync(filePath);

  if (!fileInfo.exists) {
    return null;
  }

  const content = await FileSystem.readAsStringAsync(filePath);
  return JSON.parse(content) as NetworkConfigFile;
}
