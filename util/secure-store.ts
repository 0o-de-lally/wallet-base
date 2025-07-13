import { setItemAsync, getItemAsync, deleteItemAsync } from "expo-secure-store";

/**
 * Updates the internal keys list maintained for getAllKeys functionality
 */
async function updateKeysList(
  key: string,
  operation: "add" | "remove",
): Promise<void> {
  try {
    // Don't track the keys list key itself to avoid recursion
    if (key === "all_storage_keys") {
      return;
    }

    // Get current keys list
    const keysListJson = await getItemAsync("all_storage_keys");
    const currentKeys: string[] = keysListJson ? JSON.parse(keysListJson) : [];

    if (operation === "add") {
      // Add key if not already present
      if (!currentKeys.includes(key)) {
        currentKeys.push(key);
      }
    } else if (operation === "remove") {
      // Remove key if present
      const index = currentKeys.indexOf(key);
      if (index > -1) {
        currentKeys.splice(index, 1);
      }
    }

    // Save updated keys list
    await setItemAsync("all_storage_keys", JSON.stringify(currentKeys));
  } catch (error) {
    console.error("Error updating keys list:", error);
    // Don't throw here to avoid breaking the main operation
  }
}

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
    await setItemAsync(key, value);

    // Update the keys list
    await updateKeysList(key, "add");
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
    const result = await getItemAsync(key);
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
    await deleteItemAsync(key);

    // Update the keys list
    await updateKeysList(key, "remove");
  } catch (error) {
    console.error("Error deleting from secure store:", error);
    throw error;
  }
}

/**
 * Clears all application secure storage by deleting the specified keys.
 *
 * @returns A Promise that resolves when all delete operations complete
 * @throws Will throw an error if any delete operation fails
 *
 * @remarks
 * This is a destructive operation and cannot be undone.
 * Use with caution, typically for logout, reset, or troubleshooting.
 */
export async function clearAllSecureStorage(): Promise<void> {
  try {
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

/**
 * Gets all available keys in secure storage.
 *
 * @returns Promise resolving to an array of keys
 * @throws Will throw an error if the operation fails
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    // We need to maintain a list of all keys ourselves since SecureStore doesn't provide this functionality
    const keysListJson = await getItemAsync("all_storage_keys");
    return keysListJson ? JSON.parse(keysListJson) : [];
  } catch (error) {
    console.error("Error getting all keys:", error);
    return [];
  }
}

/**
 * Development utility to rebuild the keys list from known patterns
 * This is useful if the keys list gets out of sync
 */
export async function rebuildKeysList(): Promise<void> {
  try {
    console.log("Rebuilding keys list...");

    // Try to detect existing keys using known patterns
    const knownKeys: string[] = [];

    // Check for common key patterns
    const patternsToCheck = [
      "user_pin",
      // Account keys - we'll need to check based on current profiles
    ];

    for (const key of patternsToCheck) {
      try {
        const value = await getItemAsync(key);
        if (value !== null) {
          knownKeys.push(key);
        }
      } catch {
        // Key doesn't exist, ignore
      }
    }

    // Also check for account keys based on current profiles
    // This requires importing appConfig, but we'll do it dynamically to avoid circular imports
    try {
      const { appConfig } = await import("./app-config-store");
      const profiles = appConfig.profiles.get();

      for (const [, profile] of Object.entries(profiles)) {
        for (const account of profile.accounts) {
          const accountKey = `account_${account.id}`;
          try {
            const value = await getItemAsync(accountKey);
            if (value !== null) {
              knownKeys.push(accountKey);
            }
          } catch {
            // Key doesn't exist, ignore
          }
        }
      }
    } catch (error) {
      console.error("Error checking account keys:", error);
    }

    // Save the rebuilt keys list
    await setItemAsync("all_storage_keys", JSON.stringify(knownKeys));

    console.log("Keys list rebuilt with keys:", knownKeys);
  } catch (error) {
    console.error("Error rebuilding keys list:", error);
    throw error;
  }
}
