import { appConfig } from "./app-config-store";
import { deleteValue } from "./secure-store";
import { refreshSetupStatus } from "./setup-state";
import { debugStorageKeys } from "./password-rotation";
import { secureLog, secureError } from "./secure-logging";

/**
 * Development utility to reset the app to first-time user state
 * This clears all profiles, accounts, and PIN data
 * Use only for testing purposes
 */
export async function resetAppToFirstTimeUser(): Promise<void> {
  try {
  secureLog("Resetting app to first-time user state...");

    // Clear all profiles and accounts
    appConfig.profiles.set({});
    appConfig.activeAccountId.set(null);

    // Clear PIN and password data
    await deleteValue("user_pin");
    await deleteValue("user_password");

    // Clear any other stored data that might exist
    const commonKeys = ["default", "private_key"];
    for (const key of commonKeys) {
      try {
        await deleteValue(key);
      } catch {
        // Ignore errors for keys that don't exist
      }
    }

  secureLog("App reset complete - now in first-time user state");

    // Refresh setup status to trigger reactive updates
    refreshSetupStatus();
  } catch (error) {
  secureError("Error resetting app:", error);
    throw error;
  }
}

/**
 * Development utility to check current app state
 */
export function logAppState(): void {
  const profiles = appConfig.profiles.get();
  const activeAccountId = appConfig.activeAccountId.get();

  secureLog("=== Current App State ===");
  secureLog("Profiles:", Object.keys(profiles).length);
  secureLog("Active Account ID:", activeAccountId);
  secureLog("Profiles data:", JSON.stringify(profiles, null, 2));
  secureLog("========================");
}

/**
 * Development utility to debug storage keys for PIN rotation
 */
export async function debugPinRotationStorage(): Promise<void> {
  await debugStorageKeys();
}
