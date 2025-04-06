import { observable } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";

import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  AppConfig,
  NetworkType,
  NetworkTypeEnum,
  AccountState,
  Profile,
  defaultConfig,
} from "./app-config-types";

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

  // If this is the first profile, set it as active
  if (!appConfig.activeProfile.get()) {
    appConfig.activeProfile.set(name);
  }

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
  const profile = appConfig.profiles[profileName].get();

  if (!profile) {
    return false; // Profile doesn't exist
  }

  // Check if account already exists in the profile
  const accountExists = profile.accounts.some(
    (acc) => acc.account_address === account.account_address,
  );

  if (accountExists) {
    return false; // Account already exists in this profile
  }

  // Add account to profile
  appConfig.profiles[profileName].accounts.push(account);
  return true;
}

/**
 * Sets the active profile
 *
 * @param profileName Name of the profile to set as active
 * @returns boolean indicating success or failure
 */
export function setActiveProfile(profileName: string): boolean {
  if (!appConfig.profiles[profileName].get()) {
    return false; // Profile doesn't exist
  }

  appConfig.activeProfile.set(profileName);
  appConfig.profiles[profileName].last_used.set(Date.now());
  return true;
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

  // If the deleted profile was active, reset active profile
  if (appConfig.activeProfile.get() === profileName) {
    const remainingProfiles = Object.keys(updatedProfiles);
    if (remainingProfiles.length > 0) {
      appConfig.activeProfile.set(remainingProfiles[0]);
    } else {
      appConfig.activeProfile.set(null);
    }
  }

  return true;
}

/**
 * Initializes a default profile if no profiles exist.
 * This should only run if there are no profiles in the persisted state.
 */
export function maybeInitializeDefaultProfile() {
  // Get current profiles and ensure we only initialize if truly empty
  const currentProfiles = appConfig.profiles.get();

  // Only create default profile if there are no profiles AND no active profile
  if (
    Object.keys(currentProfiles).length === 0 &&
    !appConfig.activeProfile.get()
  ) {
    console.log("No profiles found, initializing default profile");
    createProfile("mainnet", {
      network_name: "Mainnet",
      network_type: NetworkTypeEnum.MAINNET,
    });
  } else {
    console.log("Profiles already exist, skipping initialization");
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
} from "./app-config-types";
