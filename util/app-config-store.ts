import { observable } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";
import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { ObservablePersistMMKV } from "@legendapp/state/persist-plugins/mmkv";

const isMobile = (): boolean => {
  return typeof window !== "undefined" && typeof process === "object";
};
// Global configuration
if (isMobile()) {
  // Disable persistence for mobile devices
  configureObservablePersistence({
    pluginLocal: ObservablePersistMMKV,
  });
} else {
  // Enable persistence for web
  configureObservablePersistence({
    pluginLocal: ObservablePersistLocalStorage,
  });
}
configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});

/**
 * Network type represents a blockchain network configuration
 */
export type NetworkType = {
  network_name: string;
  // Additional network properties can be added here
};

/**
 * Account state represents a single blockchain account within a profile
 */
export type AccountState = {
  account_address: string;
  nickname: string; // User-friendly name for the account
  is_key_stored: boolean;
  balance_locked: number;
  balance_unlocked: number;
  last_update: number; // timestamp
};

/**
 * Profile represents a user profile containing network and accounts configuration
 */
export type Profile = {
  name: string; // unique name (required)
  network: NetworkType; // required
  accounts: AccountState[]; // list of accounts
  created_at: number; // timestamp
  last_used: number; // timestamp
};

/**
 * Application settings for global configuration
 */
export type AppSettings = {
  theme: "dark" | "light"; // UI theme
  // Add other app-wide settings here
};

/**
 * Defines the structure of the application configuration.
 */
export type AppConfig = {
  app_settings: AppSettings;
  profiles: {
    [profileName: string]: Profile;
  };
  activeProfile: string | null; // Name of the currently active profile
  // Add other config sections as needed
};

/**
 * Default configuration values for the application.
 */
const defaultConfig: AppConfig = {
  app_settings: {
    theme: "dark",
  },
  profiles: {},
  activeProfile: null,
};

/**
 * Observable application configuration state.
 * Can be subscribed to for reactive UI updates.
 */
export const appConfig = observable<AppConfig>(defaultConfig);

/**
 * Sets up persistence for the application configuration.
 * This enables config to survive app restarts.
 */
persistObservable(appConfig, {
  local: "app-config", // Storage key
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
