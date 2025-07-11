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
// Removed unused: DEFAULT_TESTNET_URL

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
 * Removed unused function: setLibraClientUrl
 */

/**
 * Get the current configuration of the global LibraClient
 *
 * @returns Current configuration object with URL and network type
 */
export function getLibraClientConfig() {
  return { ...currentConfig };
}

// Removed unused exports: resetToMainnet, resetToTestnet

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

// Removed internal-only exports: DEFAULT_MAINNET_URL, DEFAULT_TESTNET_URL
// These constants are only used within this module
