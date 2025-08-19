import { appConfig } from "./app-config-store";
import { getValue } from "./secure-store";
import { devLog, devError } from "./error-utils";

/**
 * Utility functions to determine user state and onboarding status
 */

interface Account {
  id: string;
  nickname?: string;
}

interface Profile {
  accounts?: Account[];
  [key: string]: unknown;
}

/**
 * Helper function to safely get profiles from appConfig
 */
function getProfiles(): Record<string, Profile> | null {
  try {
    if (!appConfig || !appConfig.profiles) {
      return null;
    }
    const profiles = appConfig.profiles.get();
    return profiles && typeof profiles === "object" ? profiles : null;
  } catch (error) {
    devError("user-state", error, "Error getting profiles");
    return null;
  }
}

/**
 * Checks if the user has completed the basic setup (has PIN)
 */
export async function hasPasswordSetup(): Promise<boolean> {
  try {
    const savedPin = await getValue("user_password");
    return savedPin !== null;
  } catch (error) {
    devError("user-state", error, "Error checking basic setup status");
    return false;
  }
}

/**
 * Checks if the user has any accounts configured
 */
export function hasAccounts(): boolean {
  try {
    const profiles = getProfiles();
    if (!profiles) {
      return false;
    }

    return Object.values(profiles).some(
      (profile) => profile && profile.accounts && profile.accounts.length > 0,
    );
  } catch (error) {
    devError("user-state", error, "Error checking accounts status");
    return false;
  }
}

// Removed unused exports: hasAccountsWithLogging, isFirstTimeUser

/**
    devError("user-state", error, "Error checking first-time user status");
    // If we can't determine, assume first-time for safety
    return true;
  }
}

/**
 * Gets the number of profiles the user has
 */
function getProfileCount(): number {
  try {
    const profiles = getProfiles();
    if (!profiles) {
      devLog("No profiles found, profile count is 0");
      return 0;
    }
    return Object.keys(profiles).length;
  } catch (error) {
    devError("user-state", error, "Error getting profile count");
    return 0;
  }
}

/**
 * Checks if the user has multiple profiles
 */
export function hasMultipleProfiles(): boolean {
  return getProfileCount() > 1;
}
