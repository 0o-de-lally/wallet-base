import * as Keychain from 'react-native-keychain';

export class KeychainService {
  static async storePrivateKey(accountId: string, privateKey: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(accountId, privateKey);
      return true;
    } catch (error) {
      console.error('Error storing private key:', error);
      return false;
    }
  }

  static async getPrivateKey(accountId: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword(accountId);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error retrieving private key:', error);
      return null;
    }
  }
}
