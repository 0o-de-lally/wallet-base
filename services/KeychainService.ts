import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ErrorLogger } from '@/util/errorLogging';

// Key prefix to avoid collisions
const KEY_PREFIX = 'wallet_key_';

export class KeychainService {
  static isAvailable(): boolean {
    // SecureStore is not available in web environments
    return Platform.OS !== 'web';
  }

  static async storePrivateKey(accountId: string, privateKey: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Secure storage not available on this platform');
      }

      const key = `${KEY_PREFIX}${accountId}`;
      await SecureStore.setItemAsync(key, privateKey, {
        keychainService: 'wallet.keychain',
        keychainAccessible: SecureStore.WHEN_UNLOCKED
      });
      return true;
    } catch (error) {
      console.error('Error storing private key:', error);
      ErrorLogger.logError(error, {
        context: 'KeychainService.storePrivateKey',
        accountId
      });
      return false;
    }
  }

  static async getPrivateKey(accountId: string): Promise<string | null> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Secure storage not available on this platform');
      }

      const key = `${KEY_PREFIX}${accountId}`;
      const result = await SecureStore.getItemAsync(key, {
        keychainService: 'wallet.keychain'
      });
      return result;
    } catch (error) {
      console.error('Error retrieving private key:', error);
      ErrorLogger.logError(error, {
        context: 'KeychainService.getPrivateKey',
        accountId
      });
      return null;
    }
  }

  static async removePrivateKey(accountId: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      const key = `${KEY_PREFIX}${accountId}`;
      await SecureStore.deleteItemAsync(key, {
        keychainService: 'wallet.keychain'
      });
      return true;
    } catch (error) {
      console.error('Error deleting private key:', error);
      ErrorLogger.logError(error, {
        context: 'KeychainService.removePrivateKey',
        accountId
      });
      return false;
    }
  }
}
