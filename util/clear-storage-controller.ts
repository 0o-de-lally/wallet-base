import { clearAllSecureStorage, getAllKeys } from "./secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Remove unused imports
import { clearAllScheduledReveals } from "./reveal-controller";

/**
 * Clears all storage without PIN verification
 * This is a dangerous operation that should be used with caution
 *
 * @returns Promise resolving when clearing is complete
 * @throws Error if clearing operations fail
 */
export async function clearAllStorage(): Promise<void> {
  try {
    // Find all account-specific keys
    const allKeys = await getAllKeys();
    const accountKeys = allKeys.filter((key) => key.startsWith("account_"));

    // Clear all account data
    if (accountKeys.length > 0) {
      console.log(`Clearing ${accountKeys.length} account keys`);
    }

    // Clear all secure storage
    await clearAllSecureStorage();

    // Clear all scheduled reveals
    clearAllScheduledReveals();

    console.log("All secure data cleared successfully");
  } catch (error) {
    console.error(
      "Error clearing all data:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Completely resets the application by clearing all storage including AsyncStorage.
 * This makes the app behave like a fresh installation.
 * 
 * @returns Promise resolving when all clearing operations are complete
 * @throws Error if any clearing operations fail
 */
export async function resetAppToCleanState(): Promise<void> {
  try {
    console.log("Starting complete app data reset...");
    
    // Clear all secure storage (expo-secure-store)
    await clearAllStorage();
    
    // Clear all AsyncStorage (includes Legend State persistence)
    await AsyncStorage.clear();
    
    console.log("App data reset completed - app is now in clean state");
  } catch (error) {
    console.error(
      "Error during app reset:",
      error instanceof Error ? error.message : String(error),
    );
    throw new Error(`Failed to reset app data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * [DEPRECATED] Securely clears all storage after PIN verification
 * @deprecated Use clearAllStorage() instead as PIN verification is not required
 */
export async function clearAllWithPinVerification(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pin: string,
): Promise<void> {
  console.warn("PIN verification for clearing storage is deprecated");
  await clearAllStorage();
}

/**
 * Example function with unused parameters
 */
export async function functionWithUnusedPin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pin: string,
): Promise<boolean> {
  // Function implementation goes here
  return true;
}
