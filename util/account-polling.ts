import { type LibraClient } from "open-libra-sdk";
import { appConfig, type AccountState } from "./app-config-store";
import { reportError } from "./error-utils";
import {
  fetchAccountBalance,
  updateAccountBalance,
  type BalanceData,
} from "./account-balance";
import {
  fetchAccountV8Authorization,
  updateAccountV8Authorization,
  type V8AuthData,
} from "./v8-authorization";
import {
  fetchAccountMigrationStatus,
  updateAccountMigrationStatus,
  type MigrationData,
} from "./migration-status";

export interface AccountPollingData {
  balance: BalanceData;
  v8Auth: V8AuthData;
  migration: MigrationData;
}

export interface AccountPollingResult {
  accountId: string;
  accountAddress: string;
  success: boolean;
  data?: AccountPollingData;
  error?: string;
}

/**
 * Fetches all polling data (balance, v8 authorization, migration status, etc.) for a single account
 */
export async function fetchAccountPollingData(
  client: LibraClient,
  accountAddress: string,
): Promise<AccountPollingData> {
  // First check if the account exists on chain
  try {
    await client.account.getAccountInfo({
      accountAddress: accountAddress,
    });
  } catch {
    // If account doesn't exist, return data with exists_on_chain: false
    return {
      balance: {
        balance_unlocked: 0,
        balance_total: 0,
        exists_on_chain: false,
        error: "Account does not exist on chain",
        error_type: "api",
      },
      v8Auth: {
        is_v8_authorized: false,
        error: "Account does not exist on chain",
        error_type: "api",
      },
      migration: {
        v8_migrated: false,
        error: "Account does not exist on chain",
        error_type: "api",
      },
    };
  }

  // If account exists, proceed with normal polling
  const [balance, v8Auth, migration] = await Promise.all([
    fetchAccountBalance(client, accountAddress),
    fetchAccountV8Authorization(client, accountAddress),
    fetchAccountMigrationStatus(client, accountAddress),
  ]);

  return {
    balance,
    v8Auth,
    migration,
  };
}

/**
 * Updates all account data (balance, v8 authorization, migration status, etc.) in the app state
 */
export async function updateAccountPollingData(
  accountId: string,
  pollingData: AccountPollingData,
): Promise<void> {
  // Update balance data
  await updateAccountBalance(accountId, pollingData.balance);

  // Update v8 authorization data
  await updateAccountV8Authorization(accountId, pollingData.v8Auth);

  // Update migration status data
  await updateAccountMigrationStatus(accountId, pollingData.migration);
}

/**
 * Fetches and updates all polling data for a single account
 */
export async function fetchAndUpdateAccountPollingData(
  client: LibraClient,
  account: AccountState,
): Promise<AccountPollingResult> {
  if (!account.account_address) {
    const error = "Account has no address";
    reportError("warn", "fetchAndUpdateAccountPollingData", new Error(error), {
      accountId: account.id,
    });
    return {
      accountId: account.id,
      accountAddress: "",
      success: false,
      error,
    };
  }

  try {
    const pollingData = await fetchAccountPollingData(
      client,
      account.account_address,
    );
    await updateAccountPollingData(account.id, pollingData);

    // Log successful recovery if account previously had errors
    if (
      account.error_count &&
      account.error_count > 0 &&
      !pollingData.balance.error
    ) {
      console.log(
        `[SUCCESS] Polling data fetch recovered for account ${account.id} after ${account.error_count} errors`,
      );
    }

    return {
      accountId: account.id,
      accountAddress: account.account_address,
      success: true,
      data: pollingData,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch polling data";

    reportError("warn", "fetchAndUpdateAccountPollingData", error, {
      accountId: account.id,
      accountAddress: account.account_address,
    });

    return {
      accountId: account.id,
      accountAddress: account.account_address,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetches and updates polling data for all accounts in a profile
 */
export async function fetchAndUpdateProfilePollingData(
  client: LibraClient,
  profileName: string,
  accounts: AccountState[],
  shouldSkipAccount?: (account: AccountState) => boolean,
): Promise<AccountPollingResult[]> {
  if (!client) {
    const error = "No client available";
    reportError("warn", "fetchAndUpdateProfilePollingData", new Error(error), {
      profileName,
    });
    return [];
  }

  const accountsToFetch = shouldSkipAccount
    ? accounts.filter((account) => !shouldSkipAccount(account))
    : accounts;

  if (accountsToFetch.length !== accounts.length) {
    console.debug(
      `Fetching polling data for ${accountsToFetch.length}/${accounts.length} accounts in profile ${profileName} (${accounts.length - accountsToFetch.length} skipped due to errors)`,
    );
  }

  // Fetch polling data for all accounts in parallel
  const pollingPromises = accountsToFetch.map(async (account) => {
    return await fetchAndUpdateAccountPollingData(client, account);
  });

  const results = await Promise.allSettled(pollingPromises);

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        accountId: accountsToFetch[index].id,
        accountAddress: accountsToFetch[index].account_address,
        success: false,
        error: result.reason?.message || "Unknown error",
      };
    }
  });
}

/**
 * Gets the active profile's accounts for polling
 */
export function getActiveProfileAccounts(): {
  profileName: string;
  accounts: AccountState[];
} | null {
  const activeAccountId = appConfig.activeAccountId.get();
  if (!activeAccountId) {
    return null;
  }

  const profiles = appConfig.profiles.get();

  // Find the profile containing the active account
  for (const [profileName, profile] of Object.entries(profiles)) {
    if (profile.accounts.some((acc) => acc.id === activeAccountId)) {
      return {
        profileName,
        accounts: profile.accounts,
      };
    }
  }

  return null;
}
