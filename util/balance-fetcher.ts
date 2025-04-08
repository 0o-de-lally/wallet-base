import { LibraClient } from "open-libra-sdk";
import { createLibraClient } from "./libra-client";
import { appConfig } from "./app-config-store";

// Store the interval ID for cleanup
let balanceCheckInterval: number | null = null;

/**
 * Updates the balance for a specific account in a profile
 *
 * @param profileName - The name of the profile
 * @param accountId - The ID of the account
 * @param balance - The new balance value
 */
export function updateAccountBalance(
  profileName: string,
  accountId: string,
  balance: string,
): void {
  // Find the profile and account
  const profiles = appConfig.profiles.get();
  const profile = profiles[profileName];

  if (!profile) {
    console.error(`Profile ${profileName} not found`);
    return;
  }

  // Access accounts as an array and find the correct account by ID
  const accountIndex = profile.accounts.findIndex(
    (acc) => acc.id === accountId,
  );
  if (accountIndex === -1) {
    console.error(`Account ${accountId} not found in profile ${profileName}`);
    return;
  }

  // Update the account balance using the correct array index
  appConfig.profiles[profileName].accounts[accountIndex].balance_unlocked.set(
    Number(balance),
  );
}

/**
 * Fetches balances for all accounts in all profiles
 */
export async function fetchAllAccountBalances(): Promise<void> {
  try {
    const profiles = appConfig.profiles.get();

    // Iterate through all profiles
    for (const profileName in profiles) {
      const profile = profiles[profileName];
      const { network, customEndpoint } = profile;

      // Create a client specific to this profile's network configuration
      const client = createLibraClient(network, customEndpoint);

      // Iterate through all accounts in this profile
      const accounts = profile.accounts || [];

      // Use forEach to iterate through accounts
      accounts.forEach(async (account) => {
        await fetchAccountBalance(client, profileName, account.id);
      });
    }
  } catch (error) {
    console.error("Error fetching account balances:", error);
  }
}

/**
 * Fetches the balance for a specific account
 *
 * @param client - The LibraClient instance
 * @param profileName - The name of the profile
 * @param accountId - The ID of the account
 */
async function fetchAccountBalance(
  client: LibraClient,
  profileName: string,
  accountId: string,
): Promise<void> {
  try {
    const profiles = appConfig.profiles.get();
    const profile = profiles[profileName];

    if (!profile || !profile.accounts) {
      console.error(`Profile ${profileName} not found or has no accounts`);
      return;
    }

    const accountIndex = profile.accounts.findIndex(
      (acc) => acc.id === accountId,
    );

    if (accountIndex === -1) {
      console.error(`Account ${accountId} not found in profile ${profileName}`);
      return;
    }

    const account = profile.accounts[accountIndex];

    if (!account || !account.account_address) {
      console.error(`Account ${accountId} not found or missing address`);
      return;
    }

    // Call the LibraClient to get the balance
    const balanceResponse = await client.getAccountCoinAmount({
      accountAddress: account.account_address,
    });

    if (balanceResponse) {
      // Update the account balance in the store
      updateAccountBalance(profileName, accountId, balanceResponse.toString());
    }
  } catch (error) {
    console.error(`Error fetching balance for account ${accountId}:`, error);
  }
}

/**
 * Starts the background process to periodically fetch account balances
 * @param intervalMs - Interval in milliseconds (default: 15000)
 */
export function startBalanceChecker(intervalMs: number = 15000): void {
  // First clear any existing interval to avoid duplicates
  stopBalanceChecker();

  // Fetch once immediately
  fetchAllAccountBalances();

  // Then set up recurring checks - use global.setInterval instead of NodeJS version
  balanceCheckInterval = setInterval(() => {
    fetchAllAccountBalances();
  }, intervalMs) as unknown as number;
}

/**
 * Stops the background balance checking process
 */
export function stopBalanceChecker(): void {
  if (balanceCheckInterval !== null) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
  }
}
