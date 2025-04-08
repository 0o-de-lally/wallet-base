import { observable } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";

import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  AppConfig,
  AccountState,
  Profile,
  defaultConfig,
} from "./app-config-types";
import { getNetworkEndpoint } from "./libra-client";
import { Network } from "open-libra-sdk";

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
export function createProfile(name: string, network: Network): boolean {
  // Check if profile name already exists
  const existingProfile = appConfig.profiles.get().find(p => p.name === name);
  if (existingProfile) {
    return false; // Profile already exists
  }

  const timestamp = Date.now();

  // Create new profile
  const newProfile: Profile = {
    name,
    network,
    accounts: [],
    created_at: timestamp,
    last_used: timestamp,
    customEndpoint: getNetworkEndpoint(network)
  };

  // Add new profile to profiles array using push
  appConfig.profiles.push(newProfile);

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
  const profiles = appConfig.profiles.get();
  const profileIndex = profiles.findIndex(p => p.name === profileName);

  if (profileIndex === -1) {
    return false; // Profile doesn't exist
  }

  const profile = profiles[profileIndex];

  // Check if account already exists in the profile
  const accountExists = profile.accounts.some(
    (acc) => acc.account_address === account.account_address,
  );

  if (accountExists) {
    return false; // Account already exists in this profile
  }

  // Add account to profile
  const updatedProfiles = [...profiles];
  updatedProfiles[profileIndex] = {
    ...profile,
    accounts: [...profile.accounts, account]
  };
  appConfig.profiles.set(updatedProfiles);

  // If this is the first account added to any profile, set it as active
  if (appConfig.activeAccountId.get() === null) {
    appConfig.activeAccountId.set(account.id);
  }

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
  for (const profile of profiles) {
    const accountExists = profile.accounts.some((acc) => acc.id === accountId);

    if (accountExists) {
      // Update last_used timestamp of the profile containing this account
      profile.last_used = Date.now();
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

  for (const profile of profiles) {
    const account = profile.accounts.find((acc) => acc.id === accountId);
    if (account) {
      return profile.name;
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
  const profiles = appConfig.profiles.get();
  const profileIndex = profiles.findIndex(p => p.name === profileName);

  if (profileIndex === -1) {
    return false; // Profile doesn't exist
  }

  const profile = profiles[profileIndex];

  // Get the IDs of all accounts in this profile
  const accountIdsInProfile = profile.accounts.map((acc) => acc.id);

  // Check if the active account is in this profile
  const activeAccountId = appConfig.activeAccountId.get();
  const isActiveAccountInProfile =
    activeAccountId !== null && accountIdsInProfile.includes(activeAccountId);

  // Create a new profiles array without the deleted profile
  const updatedProfiles = profiles.filter(p => p.name !== profileName);

  // Update the profiles
  appConfig.profiles.set(updatedProfiles);

  // If the active account was in the deleted profile, reset active account
  if (isActiveAccountInProfile) {
    // Try to set another account as active
    const remainingProfiles = updatedProfiles;
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
  // Get current profiles and ensure we only initialize if truly empty
  const currentProfiles = appConfig.profiles.get();

  // Only create default profile if there are no profiles AND no active account
  if (
    currentProfiles.length === 0 &&
    !appConfig.activeAccountId.get()
  ) {
    console.log("No profiles found, initializing default profile");
    createProfile("mainnet", Network.MAINNET);
  } else {
    console.log("Profiles already exist, skipping initialization");
  }
}
