import * as SecureStore from 'expo-secure-store';
// Use in-memory fallback if AsyncStorage is not installed
let memoryStorage: Record<string, string> = {};

// Force use in-memory fallback for testing environments
const USE_MEMORY_FALLBACK = true;

// More robust check for secure storage availability
const isSecureStoreAvailable = async () => {
  if (USE_MEMORY_FALLBACK) {
    return false;
  }

  try {
    // Additional check - some emulators report available but fail on actual use
    const testKey = '__secure_store_test__';
    const testValue = 'test';

    await SecureStore.setItemAsync(testKey, testValue);
    const result = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);

    return result === testValue;
  } catch (e) {
    console.log('SecureStore not available:', e);
    return false;
  }
};

// Store private key with guaranteed fallback to memory storage
export async function storePrivateKey(key: string, value: string): Promise<void> {
  try {
    const secureStoreAvailable = await isSecureStoreAvailable();

    if (secureStoreAvailable) {
      console.log('Using secure storage for:', key);
      await SecureStore.setItemAsync(key, value);
    } else {
      // Use memory fallback
      console.log('Using memory fallback storage for:', key);
      memoryStorage[`secure_${key}`] = value;
    }
  } catch (error) {
    console.error('Error in storePrivateKey:', error);
    // Use memory as final fallback
    try {
      memoryStorage[`secure_${key}`] = value;
      console.log('Recovered by storing in memory after secure store failure');
    } catch (fallbackError) {
      console.error('Final fallback storage failed:', fallbackError);
      throw new Error('Failed to store private key');
    }
  }
}

// Retrieve private key with guaranteed fallback
export async function getPrivateKey(key: string): Promise<string | null> {
  try {
    const secureStoreAvailable = await isSecureStoreAvailable();

    if (secureStoreAvailable) {
      return await SecureStore.getItemAsync(key);
    } else {
      // Use memory fallback
      return memoryStorage[`secure_${key}`] || null;
    }
  } catch (error) {
    console.error('Error in getPrivateKey:', error);
    // Try memory fallback
    return memoryStorage[`secure_${key}`] || null;
  }
}

// Delete private key with guaranteed fallback
export async function deletePrivateKey(key: string): Promise<void> {
  try {
    const secureStoreAvailable = await isSecureStoreAvailable();

    if (secureStoreAvailable) {
      await SecureStore.deleteItemAsync(key);
    } else {
      delete memoryStorage[`secure_${key}`];
    }
  } catch (error) {
    console.error('Error in deletePrivateKey:', error);
    // Try memory fallback
    delete memoryStorage[`secure_${key}`];
  }
}

// Helper to check storage mechanism
export async function getStorageMechanism(): Promise<'SecureStore' | 'Memory' | 'None'> {
  try {
    if (await isSecureStoreAvailable()) {
      return 'SecureStore';
    } else {
      return 'Memory';
    }
  } catch (e) {
    console.error('Error determining storage mechanism:', e);
  }
  return 'None';
}

// WARNING: Memory storage will not persist across app restarts
console.log('WARNING: Using in-memory storage fallback - data will not persist when app is closed');
