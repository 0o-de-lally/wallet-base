import { appConfig } from "./app-config-store";
import { deleteValue } from "./secure-store";

/**
 * Development utility to reset the app to first-time user state
 * This clears all profiles, accounts, and PIN data
 * Use only for testing purposes
 */
export async function resetAppToFirstTimeUser(): Promise<void> {
  try {
    console.log("Resetting app to first-time user state...");

    // Clear all profiles and accounts
    appConfig.profiles.set({});
    appConfig.activeAccountId.set(null);

    // Clear PIN data
    await deleteValue("user_pin");

    // Clear any other stored data that might exist
    const commonKeys = ["default", "private_key"];
    for (const key of commonKeys) {
      try {
        await deleteValue(key);
      } catch (error) {
        // Ignore errors for keys that don't exist
      }
    }

    console.log("App reset complete - now in first-time user state");
  } catch (error) {
    console.error("Error resetting app:", error);
    throw error;
  }
}

/**
 * Development utility to check current app state
 */
export function logAppState(): void {
  const profiles = appConfig.profiles.get();
  const activeAccountId = appConfig.activeAccountId.get();

  console.log("=== Current App State ===");
  console.log("Profiles:", Object.keys(profiles).length);
  console.log("Active Account ID:", activeAccountId);
  console.log("Profiles data:", JSON.stringify(profiles, null, 2));
  console.log("========================");
}
