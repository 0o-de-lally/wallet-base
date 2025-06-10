import { observable } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";

import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountAddress } from "open-libra-sdk";

import {
  AppConfig,
  NetworkType,
  NetworkTypeEnum,
  AccountState,
  Profile,
  RevealSchedule,
  defaultConfig,
} from "./app-config-types";
import { refreshSetupStatus } from "./setup-state";

// Global configuration
configureObservablePersistence({
  // Use AsyncStorage in React Native
  pluginLocal: ObservablePersistAsyncStorage,
  localOptions: {
    asyncStorage: {
      // The AsyncStorage plugin needs to be given the implementation of AsyncStorage
      AsyncStorage,
    },
  },
});

/**
 * Observable application configuration state.
 * Can be subscribed to for reactive UI updates.
 */
export const appConfig = observable<AppConfig>(defaultConfig);

/**
 * Sets up persistence for the application configuration.
 * This enables config to survive app restarts.
 */
// Configure persistence with the correct interface for Legend State 2.x
persistObservable(appConfig, {
  local: "app-config",
});

/**
 * Creates a new user profile
 *
 * @param name Unique profile name
 * @param network Network configuration
 * @returns boolean indicating success or failure
 */
export function createProfile(name: string, network: NetworkType): boolean {
  // Check if profile name already exists
  if (appConfig.profiles[name].get()) {
    return false; // Profile already exists
  }

  const timestamp = Date.now();

  // Create new profile
  appConfig.profiles[name].set({
    name,
    network,
    accounts: [],
    created_at: timestamp,
    last_used: timestamp,
  });

  // We don't set active account here anymore since profiles don't have accounts yet

  return true;
}

/**
 * Adds an account to a profile
 *
 * @param profileName Name of the profile to add the account to
 * @param account Account state to add
 * @returns boolean indicating success or failure
 */
export function addAccountToProfile(
  profileName: string,
  account: AccountState,
): boolean {
  console.log("addAccountToProfile called:", {
    profileName,
    accountId: account.id,
    accountNickname: account.nickname,
  });

  const profile = appConfig.profiles[profileName].get();

  if (!profile) {
    console.log("addAccountToProfile: Profile not found:", profileName);
    return false; // Profile doesn't exist
  }

  console.log(
    "addAccountToProfile: Profile exists, current account count:",
    profile.accounts.length,
  );

  // Check if account already exists in the profile
  const accountExists = profile.accounts.some(
    (acc) =>
      acc.account_address?.toStringLong?.() ===
      account.account_address?.toStringLong?.(),
  );

  if (accountExists) {
    console.log("addAccountToProfile: Account already exists in profile");
    return false; // Account already exists in this profile
  }

  console.log("addAccountToProfile: Adding account to profile");

  // Add account to profile
  appConfig.profiles[profileName].accounts.push(account);

  console.log(
    "addAccountToProfile: Account added, new count:",
    appConfig.profiles[profileName].accounts.get().length,
  );

  // If this is the first account added to any profile, set it as active
  if (appConfig.activeAccountId.get() === null) {
    console.log("addAccountToProfile: Setting as active account:", account.id);
    appConfig.activeAccountId.set(account.id);
  }

  // Refresh setup status to trigger reactive updates
  console.log("addAccountToProfile: Calling refreshSetupStatus");
  refreshSetupStatus();

  console.log("addAccountToProfile: Success");
  return true;
}

/**
 * Sets the active account
 *
 * @param accountId ID of the account to set as active
 * @returns boolean indicating success or failure
 */
export function setActiveAccount(accountId: string): boolean {
  // Find the account in any profile
  let found = false;

  const profiles = appConfig.profiles.get();
  for (const profileName in profiles) {
    const profile = profiles[profileName];
    const accountExists = profile.accounts.some((acc) => acc.id === accountId);

    if (accountExists) {
      // Update last_used timestamp of the profile containing this account
      appConfig.profiles[profileName].last_used.set(Date.now());
      found = true;
      break;
    }
  }

  if (!found) {
    return false; // Account doesn't exist in any profile
  }

  appConfig.activeAccountId.set(accountId);
  return true;
}

/**
 * Gets the profile name for an account ID
 *
 * @param accountId ID of the account
 * @returns profile name or null if not found
 */
export function getProfileForAccount(accountId: string): string | null {
  const profiles = appConfig.profiles.get();

  for (const profileName in profiles) {
    const profile = profiles[profileName];
    const account = profile.accounts.find((acc) => acc.id === accountId);

    if (account) {
      return profileName;
    }
  }

  return null;
}

/**
 * Deletes a profile by name
 *
 * @param profileName Name of the profile to delete
 * @returns boolean indicating success or failure
 */
export function deleteProfile(profileName: string): boolean {
  const profile = appConfig.profiles[profileName].get();

  if (!profile) {
    return false; // Profile doesn't exist
  }

  // Get the IDs of all accounts in this profile
  const accountIdsInProfile = profile.accounts.map((acc) => acc.id);

  // Check if the active account is in this profile
  const activeAccountId = appConfig.activeAccountId.get();
  const isActiveAccountInProfile =
    activeAccountId !== null && accountIdsInProfile.includes(activeAccountId);

  // Create a new profiles object without the deleted profile
  const currentProfiles = appConfig.profiles.get();
  const updatedProfiles = Object.keys(currentProfiles)
    .filter((name) => name !== profileName)
    .reduce(
      (obj, name) => {
        obj[name] = currentProfiles[name];
        return obj;
      },
      {} as Record<string, Profile>,
    );

  // Update the profiles
  appConfig.profiles.set(updatedProfiles);

  // If the active account was in the deleted profile, reset active account
  if (isActiveAccountInProfile) {
    // Try to set another account as active
    const remainingProfiles = Object.values(updatedProfiles);
    if (remainingProfiles.length > 0) {
      for (const profile of remainingProfiles) {
        if (profile.accounts.length > 0) {
          appConfig.activeAccountId.set(profile.accounts[0].id);
          return true;
        }
      }
    }

    // No accounts left in any profile
    appConfig.activeAccountId.set(null);
  }

  return true;
}

/**
 * Initializes a default profile if no profiles exist.
 * This should only run if there are no profiles in the persisted state.
 */
export function maybeInitializeDefaultProfile() {
  try {
    // Wait a moment for persistence to fully load
    setTimeout(() => {
      try {
        // Get current profiles and ensure we only initialize if truly empty
        const currentProfiles = appConfig.profiles?.get();

        // Only create default profile if there are no profiles AND no active account
        if (
          (!currentProfiles || Object.keys(currentProfiles).length === 0) &&
          !appConfig.activeAccountId?.get()
        ) {
          console.log("No profiles found, initializing default profile");
          const success = createProfile("mainnet", {
            network_name: "Mainnet",
            network_type: NetworkTypeEnum.MAINNET,
          });

          if (success) {
            console.log("Default profile 'mainnet' created successfully");
          } else {
            console.log("Failed to create default profile");
          }
        } else {
          console.log("Profiles already exist, skipping initialization", {
            profileCount: currentProfiles
              ? Object.keys(currentProfiles).length
              : 0,
            activeAccountId: appConfig.activeAccountId?.get(),
          });
        }
      } catch (innerError) {
        console.error("Error in delayed profile initialization:", innerError);
      }
    }, 10); // Very short delay to allow persistence to settle
  } catch (error) {
    console.error("Error setting up delayed profile initialization:", error);

    // Fallback to immediate initialization if delayed fails
    try {
      const currentProfiles = appConfig.profiles?.get();
      if (
        (!currentProfiles || Object.keys(currentProfiles).length === 0) &&
        !appConfig.activeAccountId?.get()
      ) {
        console.log("Fallback: Creating default profile immediately");
        createProfile("mainnet", {
          network_name: "Mainnet",
          network_type: NetworkTypeEnum.MAINNET,
        });
      }
    } catch (fallbackError) {
      console.error("Error in fallback profile initialization:", fallbackError);
    }
  }
}

/**
 * Updates the is_key_stored property for an account
 *
 * @param accountId ID of the account to update
 * @param isStored Whether the key is stored or not
 * @returns boolean indicating success or failure
 */
export function updateAccountKeyStoredStatus(
  accountId: string,
  isStored: boolean,
): boolean {
  const profiles = appConfig.profiles.get();

  for (const profileName in profiles) {
    const profile = profiles[profileName];
    const accountIndex = profile.accounts.findIndex(
      (acc) => acc.id === accountId,
    );

    if (accountIndex !== -1) {
      // Update the is_key_stored property for the found account
      appConfig.profiles[profileName].accounts[accountIndex].is_key_stored.set(
        isStored,
      );
      return true;
    }
  }

  return false; // Account not found
}

/**
 * Sets a reveal schedule for an account
 *
 * @param accountId ID of the account to set the reveal schedule for
 * @param schedule The reveal schedule to set
 * @returns boolean indicating success or failure
 */
export function setAccountRevealSchedule(
  accountId: string,
  schedule: RevealSchedule,
): boolean {
  const profiles = appConfig.profiles.get();

  for (const profileName in profiles) {
    const profile = profiles[profileName];
    const accountIndex = profile.accounts.findIndex(
      (acc) => acc.id === accountId,
    );

    if (accountIndex !== -1) {
      // Set the reveal schedule for the found account
      appConfig.profiles[profileName].accounts[
        accountIndex
      ].reveal_schedule.set(schedule);
      return true;
    }
  }

  return false; // Account not found
}

/**
 * Gets the reveal schedule for an account
 *
 * @param accountId ID of the account to get the reveal schedule for
 * @returns The reveal schedule or null if not found
 */
export function getAccountRevealSchedule(
  accountId: string,
): RevealSchedule | null {
  const profiles = appConfig.profiles.get();

  for (const profileName in profiles) {
    const profile = profiles[profileName];
    const account = profile.accounts.find((acc) => acc.id === accountId);

    if (account) {
      return account.reveal_schedule || null;
    }
  }

  return null; // Account not found
}

/**
 * Clears the reveal schedule for an account
 *
 * @param accountId ID of the account to clear the reveal schedule for
 * @returns boolean indicating success or failure
 */
export function clearAccountRevealSchedule(accountId: string): boolean {
  const profiles = appConfig.profiles.get();

  for (const profileName in profiles) {
    const profile = profiles[profileName];
    const accountIndex = profile.accounts.findIndex(
      (acc) => acc.id === accountId,
    );

    if (accountIndex !== -1) {
      // Clear the reveal schedule for the found account
      appConfig.profiles[profileName].accounts[
        accountIndex
      ].reveal_schedule.set(undefined);
      return true;
    }
  }

  return false; // Account not found
}

/**
 * Cleans up expired reveal schedules across all accounts
 * This should be called periodically or on app startup
 */
export function cleanupExpiredRevealSchedules(): void {
  const profiles = appConfig.profiles.get();
  const now = Date.now();

  for (const profileName in profiles) {
    const profile = profiles[profileName];
    profile.accounts.forEach((account, accountIndex) => {
      if (account.reveal_schedule && account.reveal_schedule.expiresAt <= now) {
        // Clear expired schedule
        appConfig.profiles[profileName].accounts[
          accountIndex
        ].reveal_schedule.set(undefined);
      }
    });
  }
}

/**
 * Fixes AccountAddress objects that were deserialized from storage
 * Converts string representations back to proper AccountAddress instances
 */
export function fixAccountAddresses(): void {
  try {
    const profiles = appConfig.profiles.get();

    if (!profiles || typeof profiles !== "object") {
      return;
    }

    let hasChanges = false;

    Object.entries(profiles).forEach(([profileName, profile]) => {
      if (profile?.accounts) {
        profile.accounts.forEach((account, index) => {
          if (
            account?.account_address &&
            typeof account.account_address === "string"
          ) {
            try {
              // Convert string back to AccountAddress object
              const fixedAddress = AccountAddress.from(account.account_address);
              appConfig.profiles[profileName].accounts[
                index
              ].account_address.set(fixedAddress);
              hasChanges = true;
            } catch (error) {
              console.error(
                `Failed to fix AccountAddress for account ${account.id}:`,
                error,
              );
            }
          }
        });
      }
    });

    if (hasChanges) {
      console.log("Fixed AccountAddress objects after loading from storage");
    }
  } catch (error) {
    console.error("Error fixing AccountAddress objects:", error);
  }
}

// Export types from the types file for backward compatibility
export {
  NetworkTypeEnum,
  type NetworkType,
  type AccountState,
  type Profile,
  type AppSettings,
  type AppConfig,
  type RevealSchedule,
} from "./app-config-types";
