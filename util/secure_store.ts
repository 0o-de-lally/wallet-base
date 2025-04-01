import * as SecureStore from 'expo-secure-store';

/**
 * Saves a key-value pair to secure storage.
 *
 * @param key - The unique identifier for the stored value
 * @param value - The string value to be stored securely
 * @returns A Promise that resolves when the save operation completes
 * @throws Will throw an error if the save operation fails
 */
export async function saveValue(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving to secure store:', error);
    throw error;
  }
}

/**
 * Retrieves a value from secure storage by its key.
 *
 * @param key - The unique identifier for the stored value
 * @returns A Promise that resolves to the stored string or null if not found
 * @throws Will throw an error if the retrieval operation fails
 */
export async function getValue(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error retrieving from secure store:', error);
    throw error;
  }
}

/**
 * Deletes a value from secure storage by its key.
 *
 * @param key - The unique identifier for the stored value to delete
 * @returns A Promise that resolves when the delete operation completes
 * @throws Will throw an error if the delete operation fails
 */
export async function deleteValue(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting from secure store:', error);
    throw error;
  }
}
