import { appConfig } from "./app-config-store";
import { getValue } from "./secure-store";

/**
 * Utility functions to determine user state and onboarding status
 */

/**
 * Checks if this is a first-time user
 * A first-time user needs to go through onboarding, which includes:
 * - Creating a PIN (if they don't have one)
 * - Setting up their first account (if they don't have any)
 */
export async function isFirstTimeUser(): Promise<boolean> {
  try {
    // Check if PIN exists
    const savedPin = await getValue("user_pin");
    const hasPIN = savedPin !== null;

    // Check if there are any profiles with accounts
    const profiles = appConfig.profiles.get();
    const hasAccountsInAnyProfile = Object.values(profiles).some(
      (profile) => profile.accounts.length > 0,
    );

    // User needs onboarding if they don't have PIN OR don't have accounts
    // This covers:
    // - Completely new users (no PIN, no accounts)
    // - Users who created PIN but didn't finish account setup (has PIN, no accounts)
    return !hasPIN || !hasAccountsInAnyProfile;
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
  try {
    const profiles = appConfig.profiles.get();
    if (!profiles || typeof profiles !== "object") {
      return false;
    }
    return Object.values(profiles).some(
      (profile) => profile && profile.accounts && profile.accounts.length > 0,
    );
  } catch (error) {
    console.error("Error checking accounts status:", error);
    return false;
  }
}

/**
 * Gets the number of profiles the user has
 */
export function getProfileCount(): number {
  try {
    const profiles = appConfig.profiles.get();
    if (!profiles || typeof profiles !== "object") {
      return 0;
    }
    return Object.keys(profiles).length;
  } catch (error) {
    console.error("Error getting profile count:", error);
    return 0;
  }
}

/**
 * Checks if the user has multiple profiles
 */
export function hasMultipleProfiles(): boolean {
  return getProfileCount() > 1;
}
