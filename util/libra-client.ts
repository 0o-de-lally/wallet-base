import { LibraClient, Network } from "open-libra-sdk";
import type { Profile } from "./app-config-types";

/**
 * Default API endpoints for different network types
 */
export const NETWORK_ENDPOINTS: Record<Network, string> = {
  [Network.MAINNET]: "https://api.mainnet.openlibranetwork.com/v1",
  [Network.TESTNET]: "https://api.testnet.openlibranetwork.com/v1",
  [Network.DEVNET]: "https://api.testing.openlibranetwork.com/v1",
  [Network.CUSTOM]: "", // Empty by default, must be provided explicitly
  [Network.LOCAL]: "http://localhost:8080", // Added LOCAL network
};

// Global client instance that can be modified as needed
export let globalClient = new LibraClient(Network.MAINNET);

/**
 * Updates the global client to use the specified network
 *
 * @param network The network to connect to
 * @param customEndpoint Optional custom endpoint URL
 * @returns The updated global client instance
 */
export function updateClientNetwork(network: Network, customEndpoint?: string): LibraClient {
  const endpoint = customEndpoint || getNetworkEndpoint(network);

  globalClient = new LibraClient(network, endpoint);
  console.log(`Updated global client endpoint to ${endpoint} for network ${network}`);
  return globalClient;
}

/**
 * Creates a new LibraClient instance
 * @deprecated Use the globalClient or updateClientNetwork instead
 *
 * @param network The network to connect to
 * @param customEndpoint Optional custom endpoint URL
 * @returns A new LibraClient instance
 */
export function createLibraClient(network: Network, customEndpoint?: string): LibraClient {
  const endpoint = customEndpoint || getNetworkEndpoint(network);
  return new LibraClient(network, endpoint);
}

/**
 * Returns the default endpoint URL for a given network
 *
 * @param network - The network type
 * @returns The default endpoint URL for the network
 */
export function getNetworkEndpoint(network: Network): string {
  return NETWORK_ENDPOINTS[network];
}

/**
 * Gets a user-friendly display name for a network
 *
 * @param profile - The profile containing the network information
 * @returns A user-friendly network name string
 */
export function getNetworkDisplayName(profile: Profile): string {
  if (!profile || !profile.network) return "Unknown";

  // Handle both string and object cases
  if (typeof profile.network === "string") {
    return profile.network;
  }

  // Fallback
  return "Unknown Network";
}
