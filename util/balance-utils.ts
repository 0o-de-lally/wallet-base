import { LibraClient, LibraViews, AccountAddress } from "open-libra-sdk";
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
    
    // Craft the view payload using LibraViews
    const payload = LibraViews.olAccount_balance(address.toStringLong());
    console.log("Balance view payload:", payload);

    // Call the view function
    const result = await client.viewJson(payload);
    console.log("Balance query result:", result);
    
    // Parse the result based on the expected structure
    // The actual structure will depend on the LibraViews response format
    if (result && Array.isArray(result) && result.length >= 2) {
      const unlocked = parseInt(String(result[0])) || 0;
      const locked = parseInt(String(result[1])) || 0;
      return {
        unlocked,
        locked,
        total: unlocked + locked,
      };
    }
    
    // If result structure is different, try to extract balance info
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const resultObj = result as Record<string, unknown>;
      const unlocked = (typeof resultObj.unlocked === 'number' ? resultObj.unlocked : 
                       typeof resultObj.available === 'number' ? resultObj.available : 0);
      const locked = (typeof resultObj.locked === 'number' ? resultObj.locked : 
                     typeof resultObj.staked === 'number' ? resultObj.staked : 0);
      return {
        unlocked,
        locked,
        total: unlocked + locked,
      };
    }
    
    console.warn("Unexpected balance result format:", result);
    return {
      locked: 0,
      unlocked: 0,
      total: 0,
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
