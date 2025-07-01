import { LibraViews, type LibraClient } from "open-libra-sdk";
import { appConfig } from "./app-config-store";
import { LIBRA_SCALE_FACTOR } from "./constants";
import { categorizeError, reportError } from "./error-utils";

export interface BalanceData {
  balance_unlocked: number;
  balance_total: number;
  error?: string;
  error_type?: "network" | "api" | "timeout" | "unknown";
}

/**
 * Fetches balance for a single account from the Libra network
 */
export async function fetchAccountBalance(
  client: LibraClient,
  accountAddress: string,
): Promise<BalanceData> {
  if (!client || !accountAddress) {
    throw new Error("Client and account address are required");
  }

  try {
    // Create the view payload using the sugar function
    const payload = LibraViews.olAccount_balance(accountAddress);

    // Call the view function
    const result = await client.viewJson(payload);

    console.log("Balance API response for", accountAddress, ":", result);

    // Handle different possible response formats
    let balance_unlocked = 0;
    let balance_total = 0;

    if (result && typeof result === "object") {
      // Try different possible response structures
      if ("locked" in result && "unlocked" in result) {
        balance_unlocked = (Number(result.unlocked) || 0) / LIBRA_SCALE_FACTOR;
        balance_total = (Number(result.locked) || 0) / LIBRA_SCALE_FACTOR;
      } else if (Array.isArray(result) && result.length >= 2) {
        // Response is an array [unlocked, total]
        balance_unlocked = (Number(result[0]) || 0) / LIBRA_SCALE_FACTOR;
        balance_total = (Number(result[1]) || 0) / LIBRA_SCALE_FACTOR;
      } else if (Array.isArray(result) && result.length === 1) {
        // Response might be an array with single balance object
        const balanceObj = result[0];
        if (
          balanceObj &&
          typeof balanceObj === "object" &&
          "locked" in balanceObj &&
          "unlocked" in balanceObj
        ) {
          balance_unlocked =
            (Number(balanceObj.unlocked) || 0) / LIBRA_SCALE_FACTOR;
          balance_total = (Number(balanceObj.locked) || 0) / LIBRA_SCALE_FACTOR;
        }
      } else {
        // Log the actual structure for debugging
        console.log(
          "Unexpected balance response structure:",
          JSON.stringify(result, null, 2),
        );
        throw new Error(
          `Unexpected balance response format: ${JSON.stringify(result).substring(0, 100)}...`,
        );
      }

      return {
        balance_unlocked,
        balance_total,
      };
    } else {
      throw new Error(
        `Invalid balance response: ${typeof result} - ${JSON.stringify(result)}`,
      );
    }
  } catch (error) {
    const { type, shouldLog } = categorizeError(error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch balance";

    // Use the error reporting system instead of console logging
    reportError(shouldLog ? "warn" : "debug", "fetchAccountBalance", error, {
      accountAddress,
      type,
    });

    // Return error state instead of throwing
    return {
      balance_unlocked: 0,
      balance_total: 0,
      error: errorMessage,
      error_type: type,
    };
  }
}

/**
 * Updates the balance for a specific account in the Legend state
 */
export async function updateAccountBalance(
  accountId: string,
  balanceData: BalanceData,
): Promise<void> {
  try {
    const profiles = appConfig.profiles.get();
    const now = Date.now();
    let accountUpdated = false;

    // Find and update the account in the profile
    Object.keys(profiles).forEach((profileKey) => {
      const profile = profiles[profileKey];
      const accountIndex = profile.accounts.findIndex(
        (acc) => acc.id === accountId,
      );
      if (accountIndex !== -1) {
        const currentAccount = profile.accounts[accountIndex];

        profile.accounts[accountIndex] = {
          ...currentAccount,
          balance_unlocked: balanceData.balance_unlocked,
          balance_total: balanceData.balance_total,
          last_update: now,
          // Handle error state
          last_error: balanceData.error || undefined,
          error_count: balanceData.error
            ? (currentAccount.error_count || 0) + 1
            : undefined, // Clear error count on successful update
        };
        // Update the profile in storage
        appConfig.profiles[profileKey].set(profile);
        accountUpdated = true;
      }
    });

    if (!accountUpdated) {
      throw new Error(`Account ${accountId} not found in any profile`);
    }
  } catch (error) {
    reportError("error", "updateAccountBalance", error, { accountId });
    throw error;
  }
}

/**
 * Fetches and updates balance for a single account
 */

// Removed unused function: fetchAndUpdateAccountBalance
// Removed unused function: fetchAndUpdateProfileBalances

/**
 * Clears error state for an account (useful for manual retries)
 */
export async function clearAccountErrors(accountId: string): Promise<boolean> {
  try {
    const profiles = appConfig.profiles.get();
    let accountFound = false;

    Object.keys(profiles).forEach((profileKey) => {
      const profile = profiles[profileKey];
      const accountIndex = profile.accounts.findIndex(
        (acc) => acc.id === accountId,
      );
      if (accountIndex !== -1) {
        const account = profile.accounts[accountIndex];
        profile.accounts[accountIndex] = {
          ...account,
          last_error: undefined,
          error_count: undefined,
        };
        appConfig.profiles[profileKey].set(profile);
        accountFound = true;
      }
    });

    return accountFound;
  } catch (error) {
    reportError("error", "clearAccountErrors", error, { accountId });
    return false;
  }
}

// Removed unused export: getBalancePollingStats
