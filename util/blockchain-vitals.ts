import { LibraClient } from "open-libra-sdk";
import { globalClient } from "./libra-client";
import { appConfig } from "./app-config-store";

export interface BlockchainVitals {
  blockHeight: string;
  epoch: string;
  lastUpdate: number;
  networkName: string;
}

// Store for blockchain vitals data
export const blockchainVitalsStore: Record<string, BlockchainVitals> = {};

/**
 * Fetches blockchain vitals for a specific network
 *
 * @param client - The LibraClient instance
 * @param networkName - The name of the network
 */
export async function fetchBlockchainVitals(
  client: LibraClient,
  networkName: string,
): Promise<void> {
  try {
    // Call the LibraClient to get the index (chain vitals)
    const indexResponse = await client.getLedgerInfo();

    if (indexResponse) {
      const vitals: BlockchainVitals = {
        blockHeight: indexResponse.block_height?.toString() || "Unknown",
        epoch: indexResponse.epoch?.toString() || "Unknown",
        lastUpdate: Date.now(),
        networkName,
      };

      // Update the vitals in the store
      blockchainVitalsStore[networkName] = vitals;
      console.log(`Updated blockchain vitals for ${networkName}`, vitals);
    }
  } catch (error) {
    console.error(`Error fetching blockchain vitals for ${networkName}:`, error);
  }
}

/**
 * Fetches blockchain vitals for all configured networks
 */
export async function fetchAllBlockchainVitals(): Promise<void> {
  try {
    const profiles = appConfig.profiles.get() || [];
    const processedNetworks = new Set<string>();

    // Iterate through all profiles to handle all unique networks
    for (const profile of profiles) {
      const { network, customEndpoint } = profile;
      // Skip duplicate networks
      const networkKey = customEndpoint ? `${network}-${customEndpoint}` : network;
      if (processedNetworks.has(networkKey)) continue;

      // Fetch vitals for this network
      await fetchBlockchainVitals(globalClient, networkKey);
      processedNetworks.add(networkKey);
    }
  } catch (error) {
    console.error("Error fetching blockchain vitals:", error);
  }
}
