import { LibraViews, type LibraClient } from "open-libra-sdk";
import { categorizeError, reportError } from "./error-utils";

export interface VouchData {
  received_vouches: string[]; // Array of addresses that vouched for this account
  given_vouches: string[]; // Array of addresses this account vouched for
  error?: string;
  error_type?: "network" | "api" | "timeout" | "unknown";
}

/**
 * Fetches vouching information for a single account from the Libra network
 */
export async function fetchAccountVouchData(
  client: LibraClient,
  accountAddress: string,
): Promise<VouchData> {
  if (!client || !accountAddress) {
    throw new Error("Client and account address are required");
  }

  try {
    console.log("Fetching vouch data for account:", accountAddress);

    // Fetch received vouches (people who vouched for this account)
    const receivedPayload =
      LibraViews.vouch_getReceivedVouchesNotExpired(accountAddress);
    const receivedResult = await client.viewJson(receivedPayload);

    // Fetch given vouches (people this account vouched for)
    const givenPayload =
      LibraViews.vouch_getGivenVouchesNotExpired(accountAddress);
    const givenResult = await client.viewJson(givenPayload);

    console.log("Vouch API response for", accountAddress, ":", {
      received: receivedResult,
      given: givenResult,
    });

    // Parse received vouches
    let received_vouches: string[] = [];
    if (Array.isArray(receivedResult)) {
      // Handle nested array format: [["addr1", "addr2", ...]]
      if (receivedResult.length > 0 && Array.isArray(receivedResult[0])) {
        received_vouches = receivedResult[0].filter(
          (addr) => typeof addr === "string",
        );
      } else {
        // Handle flat array format: ["addr1", "addr2", ...]
        received_vouches = receivedResult.filter(
          (addr) => typeof addr === "string",
        );
      }
    } else if (typeof receivedResult === "string") {
      received_vouches = [receivedResult];
    }

    // Parse given vouches
    let given_vouches: string[] = [];
    if (Array.isArray(givenResult)) {
      // Handle nested array format: [["addr1", "addr2", ...]]
      if (givenResult.length > 0 && Array.isArray(givenResult[0])) {
        given_vouches = givenResult[0].filter(
          (addr) => typeof addr === "string",
        );
      } else {
        // Handle flat array format: ["addr1", "addr2", ...]
        given_vouches = givenResult.filter((addr) => typeof addr === "string");
      }
    } else if (typeof givenResult === "string") {
      given_vouches = [givenResult];
    }

    console.log("Parsed vouch data:", {
      received_count: received_vouches.length,
      given_count: given_vouches.length,
      received_vouches: received_vouches.slice(0, 3), // Log first 3 for debugging
      given_vouches: given_vouches.slice(0, 3), // Log first 3 for debugging
    });

    return {
      received_vouches,
      given_vouches,
    };
  } catch (error) {
    const { type, shouldLog } = categorizeError(error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch vouch data";

    // Use the error reporting system
    reportError(shouldLog ? "warn" : "debug", "fetchAccountVouchData", error, {
      accountAddress,
      type,
    });

    // Return error state instead of throwing
    return {
      received_vouches: [],
      given_vouches: [],
      error: errorMessage,
      error_type: type,
    };
  }
}

/**
 * Checks if an account is initialized for vouching
 */
export async function checkVouchInitialized(
  client: LibraClient,
  accountAddress: string,
): Promise<boolean> {
  if (!client || !accountAddress) {
    return false;
  }

  try {
    const payload = LibraViews.vouch_isInit(accountAddress);
    const result = await client.viewJson(payload);

    if (typeof result === "boolean") {
      return result;
    } else if (Array.isArray(result) && result.length > 0) {
      return Boolean(result[0]);
    }

    return false;
  } catch (error) {
    console.warn("Failed to check vouch initialization:", error);
    return false;
  }
}

/**
 * Gets the current vouch price from the network
 */
export async function getVouchPrice(client: LibraClient): Promise<number> {
  try {
    const payload = LibraViews.vouch_getVouchPrice();
    const result = await client.viewJson(payload);

    if (typeof result === "number") {
      return result;
    } else if (Array.isArray(result) && result.length > 0) {
      return Number(result[0]) || 0;
    }

    return 0;
  } catch (error) {
    console.warn("Failed to get vouch price:", error);
    return 0;
  }
}
