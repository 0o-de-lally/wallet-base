/**
 * Network types available for selection
 */
export enum NetworkTypeEnum {
  MAINNET = "Mainnet",
  TESTING = "Testing",
  TESTNET = "Testnet",
  CUSTOM = "Custom",
}

/**
 * Network type represents a blockchain network configuration
 */
export type NetworkType = {
  network_name: string;
  network_type: NetworkTypeEnum;
  // Additional network properties can be added here
};

/**
 * Reveal schedule for secure data access
 */
export type RevealSchedule = {
  scheduledAt: number;
  availableAt: number;
  expiresAt: number;
};

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
  reveal_schedule?: RevealSchedule; // Optional reveal schedule for this account's secure data
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
