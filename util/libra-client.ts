import { LibraClient, Network } from "open-libra-sdk";

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

/**
 * Creates and returns a LibraClient configured for the specified network
 *
 * @param network - The network to use
 * @param customEndpoint - Custom endpoint URL (required when network is CUSTOM)
 * @param timeout - Optional request timeout in milliseconds
 * @returns Initialized LibraClient instance
 * @throws Error if no endpoint is provided for CUSTOM network
 */
export function createLibraClient(
  network: Network,
  customEndpoint?: string,
): LibraClient {
  let endpoint = getNetworkEndpoint(network);

  // If using a custom network, a custom endpoint must be provided
  if (network === Network.CUSTOM) {
    if (!customEndpoint) {
      throw new Error("Custom endpoint URL is required for CUSTOM network");
    }
    endpoint = customEndpoint;
  }

  // Initialize the client with the appropriate endpoint
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
