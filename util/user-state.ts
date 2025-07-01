import { appConfig } from "./app-config-store";
import { getValue } from "./secure-store";

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
    console.error("Error getting profiles:", error);
    return null;
  }
}

/**
 * Checks if the user has completed the basic setup (has PIN)
 */
export async function hasPINSetup(): Promise<boolean> {
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
    const profiles = getProfiles();
    if (!profiles) {
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

// Removed unused exports: hasAccountsWithLogging, isFirstTimeUser

/**
    console.error("Error checking first-time user status:", error);
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
      console.log("No profiles found, profile count is 0");
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
