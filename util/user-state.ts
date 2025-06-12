import { appConfig } from "./app-config-store";
import { getValue } from "./secure-store";

/**
 * Utility functions to determine user state and onboarding status
 */

interface Account {
  id: string;
  nickname: string;
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

/**
 * Checks if the user has any accounts configured with detailed logging
 * Use this for debugging purposes
 */
export function hasAccountsWithLogging(): boolean {
  try {
    const profiles = getProfiles();
    if (!profiles) {
      console.log("No profiles found, no accounts available");
      return false;
    }

    const hasAccountsResult = Object.values(profiles).some(
      (profile) => profile && profile.accounts && profile.accounts.length > 0,
    );

    console.log("hasAccounts check:", {
      profileCount: Object.keys(profiles).length,
      profileNames: Object.keys(profiles),
      profileDetails: Object.keys(profiles).map((name) => ({
        name,
        accountCount: profiles[name]?.accounts?.length || 0,
        accounts:
          profiles[name]?.accounts?.map((acc: Account) => ({
            id: acc.id,
            nickname: acc.nickname,
          })) || [],
      })),
      hasAccounts: hasAccountsResult,
    });

    return hasAccountsResult;
  } catch (error) {
    console.error("Error checking accounts status:", error);
    return false;
  }
}

/**
 * Checks if this is a first-time user
 * A first-time user needs to go through onboarding, which includes:
 * - Creating a PIN (if they don't have one)
 * - Setting up their first account (if they don't have any)
 */
export async function isFirstTimeUser(): Promise<boolean> {
  try {
    const hasPIN = await hasPINSetup();
    const hasUserAccounts = hasAccounts();

    // User needs onboarding if they don't have PIN OR don't have accounts
    // This covers:
    // - Completely new users (no PIN, no accounts)
    // - Users who created PIN but didn't finish account setup (has PIN, no accounts)
    return !hasPIN || !hasUserAccounts;
  } catch (error) {
    console.error("Error checking first-time user status:", error);
    // If we can't determine, assume first-time for safety
    return true;
  }
}

/**
 * Gets the number of profiles the user has
 */
export function getProfileCount(): number {
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
