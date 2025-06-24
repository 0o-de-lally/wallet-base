/**
 * Global LibraClient Instance Manager
 *
 * Provides a single instance of LibraClient that can be configured
 * and shared across the entire application to prevent multiple instances.
 */

import { LibraClient } from "open-libra-sdk";
import { IS_DEVELOPMENT } from "./environment";

// Default URLs for different networks
const DEFAULT_MAINNET_URL = "https://rpc.scan.openlibra.world/v1";
const DEFAULT_TESTNET_URL = "https://rpc.scan.openlibra.world/v1"; // Update if testnet has different URL

/**
 * Global LibraClient instance
 */
let globalLibraClient: LibraClient | null = null;

/**
 * Current configuration for the global client
 */
let currentConfig = {
  url: DEFAULT_MAINNET_URL,
  network: "mainnet" as "mainnet" | "testnet" | "custom",
};

/**
 * Initialize the global LibraClient instance
 * This should be called during app initialization
 *
 * @param url Optional URL to use for the client. Defaults to mainnet URL
 * @param network Network type identifier for logging/debugging
 */
export function initializeLibraClient(
  url: string = DEFAULT_MAINNET_URL,
  network: "mainnet" | "testnet" | "custom" = "mainnet",
): LibraClient {
  try {
    // Create new client instance - LibraClient uses default mainnet if no params
    globalLibraClient = new LibraClient();

    // Update current configuration
    currentConfig = { url, network };

    if (IS_DEVELOPMENT) {
      console.log(`LibraClient initialized with ${network} network: ${url}`);
    }

    return globalLibraClient;
  } catch (error) {
    console.error("Failed to initialize LibraClient:", error);
    throw error;
  }
}

/**
 * Get the global LibraClient instance
 * If not initialized, initializes with default mainnet configuration
 *
 * @returns The global LibraClient instance
 */
export function getLibraClient(): LibraClient {
  if (!globalLibraClient) {
    console.warn(
      "LibraClient not initialized, creating with default configuration",
    );
    return initializeLibraClient();
  }

  return globalLibraClient;
}

/**
 * Reconfigure the global LibraClient with a new URL
 * This will create a new client instance with the new configuration
 *
 * @param url New URL to use for the client
 * @param network Network type identifier for logging/debugging
 */
export function setLibraClientUrl(
  url: string,
  network: "mainnet" | "testnet" | "custom" = "custom",
): LibraClient {
  if (IS_DEVELOPMENT) {
    console.log(`Reconfiguring LibraClient to ${network} network: ${url}`);
  }

  return initializeLibraClient(url, network);
}

/**
 * Get the current configuration of the global LibraClient
 *
 * @returns Current configuration object with URL and network type
 */
export function getLibraClientConfig() {
  return { ...currentConfig };
}

/**
 * Reset the global LibraClient to mainnet defaults
 *
 * @returns The reset LibraClient instance
 */
export function resetToMainnet(): LibraClient {
  return initializeLibraClient(DEFAULT_MAINNET_URL, "mainnet");
}

/**
 * Reset the global LibraClient to testnet
 *
 * @returns The testnet LibraClient instance
 */
export function resetToTestnet(): LibraClient {
  return initializeLibraClient(DEFAULT_TESTNET_URL, "testnet");
}

/**
 * Check if the LibraClient is initialized
 *
 * @returns true if initialized, false otherwise
 */
export function isLibraClientInitialized(): boolean {
  return globalLibraClient !== null;
}

/**
 * Get the current URL being used by the global LibraClient
 * This is useful for creating LibraWallet instances with the same configuration
 *
 * @returns The current URL being used by the LibraClient
 */
export function getLibraClientUrl(): string {
  return currentConfig.url;
}

// Export the default URLs for use in other parts of the app
export { DEFAULT_MAINNET_URL, DEFAULT_TESTNET_URL };
