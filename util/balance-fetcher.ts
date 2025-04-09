import { LibraClient } from "open-libra-sdk";
import { createLibraClient } from "./libra-client";
import { appConfig } from "./app-config-store";
import { ViewArgs } from "open-libra-sdk/dist/types/types/clientPayloads";

export const balancePayload: ViewArgs = {
  payload: { function: "0x1::ol_account::balance" },
};
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
  const profiles = appConfig.profiles.get() || [];
  const profileIndex = profiles.findIndex(p => p.name === profileName);

  if (profileIndex === -1) {
    console.error(`Profile ${profileName} not found`);
    return;
  }

  const profile = profiles[profileIndex];

  // Access accounts as an array and find the correct account by ID
  const accountIndex = profile.accounts.findIndex(
    (acc) => acc.id === accountId,
  );
  if (accountIndex === -1) {
    console.error(`Account ${accountId} not found in profile ${profileName}`);
    return;
  }

  // Create a copy of the profiles array
  const updatedProfiles = [...profiles];

  // Create a copy of the specific profile
  const updatedProfile = {...updatedProfiles[profileIndex]};

  // Create a copy of the accounts array
  const updatedAccounts = [...updatedProfile.accounts];

  // Create a copy of the specific account
  const updatedAccount = {...updatedAccounts[accountIndex], balance_unlocked: Number(balance)};

  // Update the account in the accounts array
  updatedAccounts[accountIndex] = updatedAccount;

  // Update the accounts in the profile
  updatedProfile.accounts = updatedAccounts;

  // Update the profile in the profiles array
  updatedProfiles[profileIndex] = updatedProfile;

  // Set the updated profiles array
  appConfig.profiles.set(updatedProfiles);
}

/**
 * Fetches balances for all accounts in all profiles
 */
export async function fetchAllAccountBalances(): Promise<void> {
  try {
    const profiles = appConfig.profiles.get() || [];

    // Iterate through all profiles
    for (const profile of profiles) {
      const { name, network, customEndpoint } = profile;

      // Create a client specific to this profile's network configuration
      const client = createLibraClient(network, customEndpoint);

      // Iterate through all accounts in this profile
      const accounts = profile.accounts || [];

      // Use forEach to iterate through accounts
      for (const account of accounts) {
        await fetchAccountBalance(client, name, account.id);
      }
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
    const profiles = appConfig.profiles.get() || [];
    const profile = profiles.find(p => p.name === profileName);

    if (!profile || !profile.accounts) {
      console.error(`Profile ${profileName} not found or has no accounts`);
      return;
    }

    const account = profile.accounts.find(acc => acc.id === accountId);

    if (!account || !account.account_address) {
      console.error(`Account ${accountId} not found or missing address`);
      return;
    }

    // Call the LibraClient to get the balance
    const balanceResponse = await client.general.viewJson(balancePayload);
    console.log("balanceResponse", balanceResponse);

    if (balanceResponse) {
      // Update the account balance in the store
      updateAccountBalance(profileName, accountId, balanceResponse.toString());
    }
  } catch (error) {
    console.error(`Error fetching balance for account ${accountId}:`, error);
  }
}

// These functions are now deprecated and will be removed in future versions
// Use the equivalent functions from UpdateController instead

/**
 * @deprecated Use startPeriodicUpdates from UpdateController instead
 */
export function startBalanceChecker(intervalMs: number = 15000): void {
  console.warn("startBalanceChecker is deprecated. Use startPeriodicUpdates from UpdateController instead.");
  // Implementation removed to ensure usage of the new controller
}

/**
 * @deprecated Use stopPeriodicUpdates from UpdateController instead
 */
export function stopBalanceChecker(): void {
  console.warn("stopBalanceChecker is deprecated. Use stopPeriodicUpdates from UpdateController instead.");
  // Implementation removed to ensure usage of the new controller
}
