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
 * Note: AccountState is stored in Mobile storage as a simple JSON
 * so deserializing complex types like AccountAddress is not possible.
 */
export type AccountState = {
  id: string; // Unique identifier for the account (e.g., UUID or random ID)
  account_address: string; // String representation of the account address
  nickname?: string; // User-friendly name for the account (optional)
  is_key_stored: boolean;
  balance_unlocked: number;
  balance_total: number;
  last_update: number; // timestamp
  last_error?: string; // Last error encountered when fetching balance
  error_count?: number; // Number of consecutive errors (for exponential backoff)
  reveal_schedule?: RevealSchedule; // Optional reveal schedule for this account's secure data
  is_v8_authorized?: boolean; // Whether the account is v8 authorized
  v8_migrated?: boolean; // Whether the account has been migrated successfully
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
