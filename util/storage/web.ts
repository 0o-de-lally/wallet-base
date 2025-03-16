import { StorageSystem } from './types';

export class WebStorage implements StorageSystem {
  getDocumentDirectory(): string {
    return '/';
  }

  async readFile(path: string): Promise<string> {
    const data = localStorage.getItem(path);
    if (!data) throw new Error(`File not found: ${path}`);
    return data;
  }

  async writeFile(path: string, data: string): Promise<void> {
    localStorage.setItem(path, data);
  }

  async deleteFile(path: string): Promise<void> {
    localStorage.removeItem(path);
  }

  async exists(path: string): Promise<boolean> {
    return localStorage.getItem(path) !== null;
  }

  async makeDirectory(): Promise<void> {
    // No-op for web storage
  }
}
