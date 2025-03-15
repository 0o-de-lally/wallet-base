import * as FileSystem from 'expo-file-system';
import { NetworkConfigFile } from '../types/networkTypes';

const CONFIG_FILENAME = 'network-config.json';
const CONFIG_DIR = `${FileSystem.documentDirectory}configs/`;

export async function ensureConfigDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CONFIG_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CONFIG_DIR, { intermediates: true });
  }
}

export async function getConfigFilePath(): Promise<string> {
  await ensureConfigDirectory();
  return CONFIG_DIR + CONFIG_FILENAME;
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
