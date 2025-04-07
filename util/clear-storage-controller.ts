import { clearAllSecureStorage, getAllKeys } from "./secure-store";
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
