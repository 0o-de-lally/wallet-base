import * as ExpoFileSystem from 'expo-file-system';
import { StorageSystem } from './types';

export class MobileStorage implements StorageSystem {
  getDocumentDirectory(): string {
    return ExpoFileSystem.documentDirectory ?? 'file://temporary/';
  }

  async readFile(path: string): Promise<string> {
    return await ExpoFileSystem.readAsStringAsync(path);
  }

  async writeFile(path: string, data: string): Promise<void> {
    await ExpoFileSystem.writeAsStringAsync(path, data);
  }

  async deleteFile(path: string): Promise<void> {
    await ExpoFileSystem.deleteAsync(path);
  }

  async exists(path: string): Promise<boolean> {
    const info = await ExpoFileSystem.getInfoAsync(path);
    return info.exists;
  }

  async makeDirectory(path: string): Promise<void> {
    await ExpoFileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}
