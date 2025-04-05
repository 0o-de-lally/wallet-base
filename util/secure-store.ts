import * as SecureStore from "expo-secure-store";

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
    console.error("Error saving to secure store:", error);
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
    const result = await SecureStore.getItemAsync(key);
    return result;
  } catch (error) {
    console.error("Error retrieving from secure store:", error);
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
    console.error("Error deleting from secure store:", error);
    throw error;
  }
}

/**
 * Clears all application secure storage by deleting the specified keys.
 *
 * @param keys - Array of keys to delete from secure storage
 * @returns A Promise that resolves when all delete operations complete
 * @throws Will throw an error if any delete operation fails
 *
 * @remarks
 * This is a destructive operation and cannot be undone.
 * Use with caution, typically for logout, reset, or troubleshooting.
 */
export async function clearAllSecureStorage(keys?: string[]): Promise<void> {
  try {
    // If specific keys are provided, delete those
    if (keys && keys.length > 0) {
      await Promise.all(keys.map((key) => deleteValue(key)));
      console.log(`Cleared ${keys.length} specified secure storage keys`);
      return;
    }

    // Otherwise, delete all known application keys
    // Add all your application's secure storage keys here
    const appKeys = [
      "user_pin", // Added the actual PIN storage key
      "user_pin_hash",
      "user_pin_salt",
      "user_token",
      "private_key",
      "walletData",
      "settings",
      // Add other keys your app uses
    ];

    await Promise.all(appKeys.map((key) => deleteValue(key)));
    console.log(`Cleared all ${appKeys.length} secure storage keys`);
  } catch (error) {
    console.error("Error clearing secure storage:", error);
    throw error;
  }
}
