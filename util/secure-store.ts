import * as SecureStore from "expo-secure-store";

// Define types for the reveal scheduling system
type RevealSchedule = {
  key: string;
  scheduledAt: number;
  availableAt: number;
  expiresAt: number;
};

// In-memory store for scheduled reveals (cleared on app restart)
let scheduledReveals: Record<string, RevealSchedule> = {};

// Configuration for the reveal timing windows
const REVEAL_CONFIG = {
  waitingPeriodMs: 30 * 1000, // 30 seconds waiting period
  revealWindowMs: 2 * 60 * 1000, // 2 minutes to reveal after available
};

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

/**
 * Schedules a reveal for a secure value.
 * The user must wait for the waiting period before they can reveal the value,
 * and must complete the reveal within the reveal window.
 *
 * @param key - The key of the value to be revealed
 * @returns The scheduled reveal details
 */
export function scheduleReveal(key: string): RevealSchedule {
  const now = Date.now();
  const schedule: RevealSchedule = {
    key,
    scheduledAt: now,
    availableAt: now + REVEAL_CONFIG.waitingPeriodMs,
    expiresAt: now + REVEAL_CONFIG.waitingPeriodMs + REVEAL_CONFIG.revealWindowMs
  };

  scheduledReveals[key] = schedule;
  return schedule;
}

/**
 * Checks the status of a scheduled reveal.
 *
 * @param key - The key of the scheduled reveal
 * @returns Object with status information, or null if no reveal is scheduled
 */
export function checkRevealStatus(key: string): {
  scheduled: boolean;
  available: boolean;
  expired: boolean;
  waitTimeRemaining: number;
  expiresIn: number;
} | null {
  const schedule = scheduledReveals[key];
  if (!schedule) {
    return null;
  }

  const now = Date.now();
  const available = now >= schedule.availableAt;
  const expired = now >= schedule.expiresAt;

  return {
    scheduled: true,
    available,
    expired,
    waitTimeRemaining: Math.max(0, schedule.availableAt - now),
    expiresIn: Math.max(0, schedule.expiresAt - now)
  };
}

/**
 * Gets a value if its reveal has been scheduled and is currently available.
 *
 * @param key - The key of the value to reveal
 * @returns A Promise that resolves to the value if available within the reveal window, or null otherwise
 */
export async function getScheduledReveal(key: string): Promise<{value: string | null, status: string}> {
  const status = checkRevealStatus(key);

  if (!status) {
    return { value: null, status: "not_scheduled" };
  }

  if (!status.available) {
    return { value: null, status: "waiting" };
  }

  if (status.expired) {
    // Clean up expired reveal request
    delete scheduledReveals[key];
    return { value: null, status: "expired" };
  }

  try {
    // Retrieve the value since we're in the valid reveal window
    const value = await getValue(key);

    // Keep the scheduled reveal active until it expires
    // It will be automatically unavailable after expiration
    return { value, status: "revealed" };
  } catch (error) {
    console.error("Error retrieving scheduled reveal:", error);
    return { value: null, status: "error" };
  }
}

/**
 * Cancels a scheduled reveal.
 *
 * @param key - The key of the scheduled reveal to cancel
 */
export function cancelReveal(key: string): void {
  delete scheduledReveals[key];
}

/**
 * Clears all scheduled reveals.
 */
export function clearAllScheduledReveals(): void {
  scheduledReveals = {};
}
