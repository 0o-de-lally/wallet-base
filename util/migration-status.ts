import { type LibraClient } from "open-libra-sdk";
import { categorizeError, reportError } from "./error-utils";

export interface MigrationData {
  v8_migrated: boolean;
  error?: string;
  error_type?: "network" | "api" | "timeout" | "unknown";
}

/**
 * Fetches migration status for a single account from the Libra network
 */
export async function fetchAccountMigrationStatus(
  client: LibraClient,
  accountAddress: string,
): Promise<MigrationData> {
  if (!client || !accountAddress) {
    throw new Error("Client and account address are required");
  }

  try {
    // Create the view payload for the activity function
    const payload = {
      payload: {
        function: "0x1::activity::is_initialized" as const,
        type_arguments: [],
        arguments: [accountAddress],
      },
    };

    // Call the view function
    const result = await client.viewJson(payload);

    console.log("Migration API response for", accountAddress, ":", result);

    // The result should be a boolean or an array containing a boolean
    let v8_migrated = false;

    if (typeof result === "boolean") {
      v8_migrated = result;
    } else if (Array.isArray(result) && result.length > 0) {
      v8_migrated = Boolean(result[0]);
    } else if (result && typeof result === "object" && "value" in result) {
      v8_migrated = Boolean(result.value);
    } else {
      console.log(
        "Unexpected migration response structure:",
        JSON.stringify(result, null, 2),
      );
      throw new Error(
        `Unexpected migration response format: ${JSON.stringify(result).substring(0, 100)}...`,
      );
    }

    return {
      v8_migrated,
    };
  } catch (error) {
    const { type, shouldLog } = categorizeError(error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch migration status";

    // Use the error reporting system
    reportError(
      shouldLog ? "warn" : "debug",
      "fetchAccountMigrationStatus",
      error,
      {
        accountAddress,
        type,
      },
    );

    // Return error state instead of throwing
    return {
      v8_migrated: false,
      error: errorMessage,
      error_type: type,
    };
  }
}

/**
 * Updates the migration status for a specific account in the app state
 */
export async function updateAccountMigrationStatus(
  accountId: string,
  migrationData: MigrationData,
): Promise<void> {
  const { appConfig } = await import("./app-config-store");

  try {
    const profiles = appConfig.profiles.get();
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
          v8_migrated: migrationData.v8_migrated,
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
    reportError("error", "updateAccountMigrationStatus", error, { accountId });
    throw error;
  }
}

/**
 * Fetches and updates migration status for a single account
 */
export async function fetchAndUpdateAccountMigrationStatus(
  client: LibraClient,
  accountId: string,
  accountAddress: string,
): Promise<void> {
  try {
    const migrationData = await fetchAccountMigrationStatus(
      client,
      accountAddress,
    );
    await updateAccountMigrationStatus(accountId, migrationData);
  } catch (error) {
    reportError("warn", "fetchAndUpdateAccountMigrationStatus", error, {
      accountId,
      accountAddress,
    });
  }
}
