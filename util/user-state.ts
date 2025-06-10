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
    // Add robust error handling for appConfig availability
    let hasAccountsInAnyProfile = false;
    try {
      if (appConfig && appConfig.profiles) {
        const profiles = appConfig.profiles.get();
        if (profiles && typeof profiles === "object") {
          hasAccountsInAnyProfile = Object.values(profiles).some(
            (profile) =>
              profile && profile.accounts && profile.accounts.length > 0,
          );
        }
      }
    } catch (profileError) {
      console.log("Error checking profiles in isFirstTimeUser:", profileError);
      // If we can't check profiles, assume no accounts exist
      hasAccountsInAnyProfile = false;
    }

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
    // Ensure appConfig is initialized
    if (!appConfig || !appConfig.profiles) {
      console.log("AppConfig not initialized yet, no accounts available");
      return false;
    }

    const profiles = appConfig.profiles.get();
    if (!profiles || typeof profiles !== "object") {
      console.log("No profiles object found, no accounts available");
      return false;
    }

    const hasAccountsResult = Object.values(profiles).some(
      (profile) => profile && profile.accounts && profile.accounts.length > 0,
    );

    console.log("hasAccounts check:", {
      profileCount: Object.keys(profiles).length,
      hasAccounts: hasAccountsResult,
    });

    return hasAccountsResult;
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
    // Ensure appConfig is initialized
    if (!appConfig || !appConfig.profiles) {
      console.log("AppConfig not initialized yet, profile count is 0");
      return 0;
    }

    const profiles = appConfig.profiles.get();
    if (!profiles || typeof profiles !== "object") {
      console.log("No profiles object found, profile count is 0");
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
