// TODO: why are using this here, when we load it at _layout as well
import "@/util/crypto-polyfill";

import { Network } from "open-libra-sdk";
import { getNetworkEndpoint } from "./libra-client";

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
  customEndpoint: string; // custom endpoint URL for the network
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

/**
 * Helper function to create a new profile with default endpoint based on network
 *
 * @param name Profile name
 * @param network Network type
 * @param customEndpoint Optional custom endpoint (defaults to network's default endpoint)
 * @returns A new profile object with proper defaults
 */
export function createDefaultProfile(
  name: string,
  network: Network = Network.TESTNET,
  customEndpoint?: string,
): Profile {
  return {
    name,
    network,
    customEndpoint: customEndpoint || getNetworkEndpoint(network),
    accounts: [],
    created_at: Date.now(),
    last_used: Date.now(),
  };
}
