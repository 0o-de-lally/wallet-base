import { LibraViews, type LibraClient } from "open-libra-sdk";
import { appConfig } from "./app-config-store";
import type { AccountState } from "./app-config-store";
import { LIBRA_SCALE_FACTOR } from "./constants";

export interface BalanceData {
  balance_unlocked: number;
  balance_total: number;
  error?: string;
  error_type?: "network" | "api" | "timeout" | "unknown";
}

/**
 * Categorizes error types for better handling
 */
function categorizeError(error: any): {
  type: "network" | "api" | "timeout" | "unknown";
  shouldLog: boolean;
} {
  const errorMessage = error?.message || error?.toString() || "";

  // Network timeout or connection errors (common and expected)
  if (
    errorMessage.includes("504") ||
    errorMessage.includes("Gateway Time-out") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("ETIMEDOUT") ||
    errorMessage.includes("ECONNRESET") ||
    errorMessage.includes("ECONNREFUSED")
  ) {
    return { type: "timeout", shouldLog: false };
  }

  // Other HTTP errors (5xx server errors, 3xx redirects, etc.)
  if (
    errorMessage.includes("502") ||
    errorMessage.includes("503") ||
    errorMessage.includes("500") ||
    errorMessage.includes("Bad Gateway") ||
    errorMessage.includes("Service Unavailable")
  ) {
    return { type: "network", shouldLog: false };
  }

  // API-specific errors (4xx client errors)
  if (
    errorMessage.includes("400") ||
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("404")
  ) {
    return { type: "api", shouldLog: true };
  }

  // Unknown errors should be logged for debugging
  return { type: "unknown", shouldLog: true };
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

    // Only log unexpected errors to avoid console spam from network issues
    if (shouldLog) {
      console.error(
        "Failed to fetch balance for account:",
        accountAddress,
        error,
      );
    } else {
      // For network/timeout errors, just log a brief debug message
      console.debug(
        `Balance fetch ${type} for account ${accountAddress.substring(0, 8)}...: ${errorMessage.substring(0, 100)}`,
      );
    }

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
    console.error("Failed to update stored account balance:", error);
    throw error;
  }
}

/**
 * Fetches and updates balance for a single account
 */
export async function fetchAndUpdateAccountBalance(
  client: LibraClient,
  account: AccountState,
): Promise<void> {
  if (!account.account_address) {
    console.warn(
      `Account ${account.id} has no address, skipping balance fetch`,
    );
    return;
  }

  try {
    const balanceData = await fetchAccountBalance(
      client,
      account.account_address,
    );
    await updateAccountBalance(account.id, balanceData);

    // Log successful recovery if account previously had errors
    if (account.error_count && account.error_count > 0 && !balanceData.error) {
      console.log(
        `✓ Balance fetch recovered for account ${account.id} after ${account.error_count} errors`,
      );
    }
  } catch (error) {
    // This should rarely happen now since fetchAccountBalance returns errors instead of throwing
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch balance";
    console.warn(
      `Unexpected error updating balance for account ${account.id}:`,
      errorMessage,
    );

    // Update account with error state
    await updateAccountBalance(account.id, {
      balance_unlocked: account.balance_unlocked,
      balance_total: account.balance_total,
      error: errorMessage,
      error_type: "unknown",
    });
  }
}

/**
 * Fetches and updates balances for all accounts in a profile
 */
export async function fetchAndUpdateProfileBalances(
  client: LibraClient,
  profileName: string,
  accounts: AccountState[],
): Promise<void> {
  if (!client) {
    console.warn("No client available, skipping balance fetch");
    return;
  }

  console.log(
    `Fetching balances for ${accounts.length} accounts in profile ${profileName}`,
  );

  // Fetch balances for all accounts in parallel
  const balancePromises = accounts.map(async (account) => {
    await fetchAndUpdateAccountBalance(client, account);
  });

  await Promise.allSettled(balancePromises);
}

/**
 * Fetches and updates balances for all accounts across all profiles
 */
export async function fetchAndUpdateAllBalances(
  client: LibraClient,
): Promise<void> {
  if (!client) {
    console.warn("No client available, skipping balance fetch");
    return;
  }

  const profiles = appConfig.profiles.get();

  if (!profiles || Object.keys(profiles).length === 0) {
    console.warn("No profiles found, skipping balance fetch");
    return;
  }

  console.log("Fetching balances for all accounts across all profiles");

  // Fetch balances for all profiles in parallel
  const profilePromises = Object.entries(profiles).map(
    async ([profileName, profile]) => {
      if (profile?.accounts?.length > 0) {
        try {
          await fetchAndUpdateProfileBalances(
            client,
            profileName,
            profile.accounts,
          );
        } catch (error) {
          console.error(
            `Failed to update balances for profile ${profileName}:`,
            error,
          );
        }
      }
    },
  );

  await Promise.allSettled(profilePromises);
}

/**
 * Fetches and updates balances for all accounts in a profile with smart error handling
 * Accounts with consecutive errors may be skipped based on exponential backoff
 */
export async function fetchAndUpdateProfileBalancesWithBackoff(
  client: LibraClient,
  profileName: string,
  accounts: AccountState[],
  shouldSkipAccount?: (account: AccountState) => boolean,
): Promise<void> {
  if (!client) {
    console.warn("No client available, skipping balance fetch");
    return;
  }

  const accountsToFetch = shouldSkipAccount
    ? accounts.filter((account) => !shouldSkipAccount(account))
    : accounts;

  if (accountsToFetch.length !== accounts.length) {
    console.debug(
      `Fetching balances for ${accountsToFetch.length}/${accounts.length} accounts in profile ${profileName} (${accounts.length - accountsToFetch.length} skipped due to errors)`,
    );
  } else {
    console.log(
      `Fetching balances for ${accountsToFetch.length} accounts in profile ${profileName}`,
    );
  }

  // Fetch balances for filtered accounts in parallel
  const balancePromises = accountsToFetch.map(async (account) => {
    await fetchAndUpdateAccountBalance(client, account);
  });

  await Promise.allSettled(balancePromises);
}

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
    console.error("Failed to clear account errors:", error);
    return false;
  }
}

/**
 * Gets statistics about balance polling health across all accounts
 */
export function getBalancePollingStats(): {
  totalAccounts: number;
  accountsWithErrors: number;
  accountsSkipped: number;
  lastSuccessfulPoll: number | null;
} {
  const profiles = appConfig.profiles.get();
  let totalAccounts = 0;
  let accountsWithErrors = 0;
  let accountsSkipped = 0;
  let lastSuccessfulPoll: number | null = null;

  Object.values(profiles).forEach((profile) => {
    if (profile?.accounts) {
      profile.accounts.forEach((account) => {
        totalAccounts++;

        if (account.last_error) {
          accountsWithErrors++;
        }

        if (account.error_count && account.error_count > 5) {
          accountsSkipped++;
        }

        if (
          account.last_update &&
          (!lastSuccessfulPoll || account.last_update > lastSuccessfulPoll)
        ) {
          lastSuccessfulPoll = account.last_update;
        }
      });
    }
  });

  return {
    totalAccounts,
    accountsWithErrors,
    accountsSkipped,
    lastSuccessfulPoll,
  };
}
