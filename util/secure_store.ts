import * as SecureStore from 'expo-secure-store';

export async function saveValue(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving to secure store:', error);
    throw error;
  }
}

export async function getValue(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error retrieving from secure store:', error);
    throw error;
  }
}

export async function deleteValue(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting from secure store:', error);
    throw error;
  }
}
