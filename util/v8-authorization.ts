import { type LibraClient } from "open-libra-sdk";
import { categorizeError, reportError } from "./error-utils";

export interface V8AuthData {
  is_v8_authorized: boolean;
  error?: string;
  error_type?: "network" | "api" | "timeout" | "unknown";
}

/**
 * Fetches v8 authorization status for a single account from the Libra network
 */
export async function fetchAccountV8Authorization(
  client: LibraClient,
  accountAddress: string,
): Promise<V8AuthData> {
  if (!client || !accountAddress) {
    throw new Error("Client and account address are required");
  }

  try {
    // Create the view payload for the reauthorization function
    const payload = {
      payload: {
        function: "0x1::reauthorization::is_v8_authorized" as const,
        type_arguments: [],
        arguments: [accountAddress],
      },
    };

    // Call the view function
    const result = await client.viewJson(payload);

    console.log("V8 Auth API response for", accountAddress, ":", result);

    // The result should be a boolean or an array containing a boolean
    let is_v8_authorized = false;

    if (typeof result === "boolean") {
      is_v8_authorized = result;
    } else if (Array.isArray(result) && result.length > 0) {
      is_v8_authorized = Boolean(result[0]);
    } else if (result && typeof result === "object" && "value" in result) {
      is_v8_authorized = Boolean(result.value);
    } else {
      console.log(
        "Unexpected v8 auth response structure:",
        JSON.stringify(result, null, 2),
      );
      throw new Error(
        `Unexpected v8 auth response format: ${JSON.stringify(result).substring(0, 100)}...`,
      );
    }

    return {
      is_v8_authorized,
    };
  } catch (error) {
    const { type, shouldLog } = categorizeError(error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch v8 authorization";

    // Use the error reporting system
    reportError(shouldLog ? "warn" : "debug", "fetchAccountV8Authorization", error, {
      accountAddress,
      type,
    });

    // Return error state instead of throwing
    return {
      is_v8_authorized: false,
      error: errorMessage,
      error_type: type,
    };
  }
}

/**
 * Updates the v8 authorization status for a specific account in the app state
 */
export async function updateAccountV8Authorization(
  accountId: string,
  v8AuthData: V8AuthData,
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
          is_v8_authorized: v8AuthData.is_v8_authorized,
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
    reportError("error", "updateAccountV8Authorization", error, { accountId });
    throw error;
  }
}

/**
 * Fetches and updates v8 authorization status for a single account
 */
export async function fetchAndUpdateAccountV8Authorization(
  client: LibraClient,
  accountId: string,
  accountAddress: string,
): Promise<void> {
  try {
    const v8AuthData = await fetchAccountV8Authorization(client, accountAddress);
    await updateAccountV8Authorization(accountId, v8AuthData);
  } catch (error) {
    reportError("warn", "fetchAndUpdateAccountV8Authorization", error, {
      accountId,
      accountAddress,
    });
  }
}