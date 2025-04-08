import { Network } from "open-libra-sdk";

/**
 * Account state represents a single blockchain account within a profile
 */
export type AccountState = {
  id: string; // Unique identifier for the account (e.g., UUID or random ID)
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
  network: Network; // Using open-libra-sdk Network type
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
  activeAccountId: string | null; // ID of the currently active account (replacing activeProfile)
  // Add other config sections as needed
};

/**
 * Default configuration values for the application.
 */
export const defaultConfig: AppConfig = {
  app_settings: {
    theme: "dark",
  },
  profiles: {},
  activeAccountId: null,
};
