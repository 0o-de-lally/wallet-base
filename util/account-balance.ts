import { LibraViews, type LibraClient } from "open-libra-sdk";
import { appConfig } from "./app-config-store";
import type { AccountState } from "./app-config-store";

export interface BalanceData {
  balance_unlocked: number;
  balance_total: number;
  error?: string;
}

/**
 * Fetches balance for a single account from the Libra network
 */
export async function fetchAccountBalance(
  client: LibraClient,
  accountAddress: string
): Promise<BalanceData> {
  if (!client || !accountAddress) {
    throw new Error("Client and account address are required");
  }

  try {
    // Create the view payload using the sugar function
    const payload = LibraViews.olAccount_balance(accountAddress);

    // Call the view function
    const result = await client.viewJson(payload);

    console.log(
      "Balance API response for",
      accountAddress,
      ":",
      result,
    );

    // Handle different possible response formats
    let balance_unlocked = 0;
    let balance_total = 0;

    if (result && typeof result === "object") {
      // Try different possible response structures
      if ("locked" in result && "unlocked" in result) {
        balance_unlocked = Number(result.unlocked) || 0;
        balance_total = Number(result.locked) || 0;
      } else if (Array.isArray(result) && result.length >= 2) {
        // Response is an array [unlocked, total]
        balance_unlocked = Number(result[0]) || 0;
        balance_total = Number(result[1]) || 0;
      } else if (Array.isArray(result) && result.length === 1) {
        // Response might be an array with single balance object
        const balanceObj = result[0];
        if (
          balanceObj &&
          typeof balanceObj === "object" &&
          "locked" in balanceObj &&
          "unlocked" in balanceObj
        ) {
          balance_unlocked = Number(balanceObj.unlocked) || 0;
          balance_total = Number(balanceObj.locked) || 0;
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
    console.error(
      "Failed to fetch balance for account:",
      accountAddress,
      error,
    );
    throw error;
  }
}

/**
 * Updates the balance for a specific account in the Legend state
 */
export async function updateAccountBalance(
  accountId: string,
  balanceData: BalanceData
): Promise<void> {
  try {
    const profiles = appConfig.profiles.get();
    const now = Date.now();
    let accountUpdated = false;

    // Find and update the account in the profile
    Object.keys(profiles).forEach(profileKey => {
      const profile = profiles[profileKey];
      const accountIndex = profile.accounts.findIndex(acc => acc.id === accountId);
      if (accountIndex !== -1) {
        profile.accounts[accountIndex] = {
          ...profile.accounts[accountIndex],
          balance_unlocked: balanceData.balance_unlocked,
          balance_total: balanceData.balance_total,
          last_update: now,
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
  account: AccountState
): Promise<void> {
  if (!account.account_address) {
    console.warn(`Account ${account.id} has no address, skipping balance fetch`);
    return;
  }

  try {
    const balanceData = await fetchAccountBalance(client, account.account_address);
    await updateAccountBalance(account.id, balanceData);
  } catch (error) {
    console.error(`Failed to fetch and update balance for account ${account.id}:`, error);
    // Update account with error state
    await updateAccountBalance(account.id, {
      balance_unlocked: account.balance_unlocked,
      balance_total: account.balance_total,
      error: error instanceof Error ? error.message : "Failed to fetch balance",
    });
    throw error;
  }
}

/**
 * Fetches and updates balances for all accounts in a profile
 */
export async function fetchAndUpdateProfileBalances(
  client: LibraClient,
  profileName: string,
  accounts: AccountState[]
): Promise<void> {
  if (!client) {
    console.warn("No client available, skipping balance fetch");
    return;
  }

  console.log(`Fetching balances for ${accounts.length} accounts in profile ${profileName}`);

  // Fetch balances for all accounts in parallel
  const balancePromises = accounts.map(async (account) => {
    try {
      await fetchAndUpdateAccountBalance(client, account);
    } catch (error) {
      // Log error but don't fail the entire batch
      console.error(`Failed to update balance for account ${account.id}:`, error);
    }
  });

  await Promise.allSettled(balancePromises);
}

/**
 * Fetches and updates balances for all accounts across all profiles
 */
export async function fetchAndUpdateAllBalances(client: LibraClient): Promise<void> {
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
  const profilePromises = Object.entries(profiles).map(async ([profileName, profile]) => {
    if (profile?.accounts?.length > 0) {
      try {
        await fetchAndUpdateProfileBalances(client, profileName, profile.accounts);
      } catch (error) {
        console.error(`Failed to update balances for profile ${profileName}:`, error);
      }
    }
  });

  await Promise.allSettled(profilePromises);
}
