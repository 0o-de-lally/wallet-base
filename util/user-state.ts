import { appConfig } from "./app-config-store";
import { getValue } from "./secure-store";

/**
 * Utility functions to determine user state and onboarding status
 */

/**
 * Checks if this is a first-time user
 * A first-time user has no PIN and no profiles with accounts
 */
export async function isFirstTimeUser(): Promise<boolean> {
  try {
    // Check if PIN exists
    const savedPin = await getValue("user_pin");
    const hasPIN = savedPin !== null;

    // Check if there are any profiles with accounts
    const profiles = appConfig.profiles.get();
    const hasAccountsInAnyProfile = Object.values(profiles).some(
      profile => profile.accounts.length > 0
    );

    // First-time user has no PIN and no accounts
    return !hasPIN && !hasAccountsInAnyProfile;
  } catch (error) {
    console.error("Error checking first-time user status:", error);
    // If we can't determine, assume first-time for safety
    return true;
  }
}

/**
 * Checks if the user has completed the basic setup (has PIN)
 */
export async function hasCompletedBasicSetup(): Promise<boolean> {
  try {
    const savedPin = await getValue("user_pin");
    return savedPin !== null;
  } catch (error) {
    console.error("Error checking basic setup status:", error);
    return false;
  }
}

/**
 * Checks if the user has any accounts configured
 */
export function hasAccounts(): boolean {
  const profiles = appConfig.profiles.get();
  return Object.values(profiles).some(
    profile => profile.accounts.length > 0
  );
}

/**
 * Gets the number of profiles the user has
 */
export function getProfileCount(): number {
  const profiles = appConfig.profiles.get();
  return Object.keys(profiles).length;
}

/**
 * Checks if the user has multiple profiles
 */
export function hasMultipleProfiles(): boolean {
  return getProfileCount() > 1;
}
