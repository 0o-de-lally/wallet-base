import { LibraClient } from "open-libra-sdk";
import type { AccountAddress } from "open-libra-sdk";
import type { NetworkType } from "./app-config-types";

/**
 * Gets the appropriate URL for a network configuration
 */
export function getNetworkUrl(network: NetworkType): string {
  // If custom URL is provided, use it
  if (network.rpc_url && network.rpc_url.trim()) {
    return network.rpc_url.trim();
  }

  // Otherwise use predefined URLs based on network type
  switch (network.network_type) {
    case "Mainnet":
      return "https://rpc.scan.openlibra.world/v1";
    case "Testnet":
      return "https://testnet-rpc.scan.openlibra.world/v1"; // Assuming testnet URL
    case "Testing":
      return "https://testing-rpc.scan.openlibra.world/v1"; // Assuming testing URL
    case "Custom":
      // For custom networks without URL, default to mainnet
      return "https://rpc.scan.openlibra.world/v1";
    default:
      return "https://rpc.scan.openlibra.world/v1";
  }
}

/**
 * Balance information for an account
 */
export interface AccountBalance {
  locked: number;
  unlocked: number;
  total: number;
}

/**
 * Queries account balance using the LibraClient
 */
export async function queryAccountBalance(
  client: LibraClient,
  address: AccountAddress
): Promise<AccountBalance | null> {
  try {
    console.log("Querying balance for address:", address.toStringLong());
    
    // TODO: The LibraClient currently only supports getLedgerInfo()
    // Once the SDK provides account-specific query methods, this should be updated
    // For now, we'll return a placeholder indicating the feature is not yet available
    
    console.log("Balance querying not yet implemented - SDK limitations");
    
    // Return zeros for now - accounts will show 0 balance until SDK provides the API
    return {
      locked: 0,
      unlocked: 0,
      total: 0
    };

  } catch (error) {
    console.error("Failed to query account balance:", error);
    return null;
  }
}

/**
 * Updates account balance in the app config
 */
export function updateAccountBalance(
  accountId: string,
  locked: number,
  unlocked: number
): boolean {
  try {
    // This would update the account's balance in the app config
    // Implementation would be similar to other account update functions
    console.log(`Updating balance for account ${accountId}: locked=${locked}, unlocked=${unlocked}`);
    
    // Placeholder - actual implementation would update appConfig
    return true;
  } catch (error) {
    console.error("Failed to update account balance:", error);
    return false;
  }
}
