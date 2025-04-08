import { getRandomBytesAsync } from "expo-crypto";
import { uint8ArrayToBase64 } from "./crypto";
import {
  addAccountToProfile,
  setActiveAccount,
  appConfig,
} from "./app-config-store";
import type { AccountState } from "./app-config-store";

/**
 * Validates if a string is a valid Open Libra account address
 *
 * @param address String to validate as an account address
 * @returns A validated address string if valid, or null if invalid
 */
export function validateAccountAddress(address: string): string | null {
  try {
    if (!address || typeof address !== "string") {
      return null;
    }

    const trimmedAddress = address.trim();

    // Check for 0x prefix
    if (!trimmedAddress.startsWith("0x")) {
      return null;
    }

    // Check for valid hex characters (0-9, a-f, A-F) after the 0x prefix
    const hexPart = trimmedAddress.substring(2);
    if (!hexPart || !/^[0-9a-fA-F]+$/.test(hexPart)) {
      return null;
    }

    return trimmedAddress;
  } catch (error) {
    console.error("Invalid account address format:", error);
    return null;
  }
}

/**
 * Creates a new account in the specified profile
 *
 * @param profileName Name of the profile to add the account to
 * @param accountAddressStr Address of the account as a string (0x... format)
 * @param nickname Optional nickname for the account
 * @returns Object containing success status, error message (if any), and created account (if successful)
 */
export async function createAccount(
  profileName: string,
  accountAddressStr: string,
  nickname: string,
): Promise<{
  success: boolean;
  error?: string;
  account?: AccountState;
}> {
  try {
    // Validate inputs
    if (!accountAddressStr || !accountAddressStr.trim()) {
      return {
        success: false,
        error: "Account address is required",
      };
    }

    if (!profileName) {
      return {
        success: false,
        error: "Profile name is required",
      };
    }

    // Validate and convert the address string to an AccountAddress object
    const accountAddress = validateAccountAddress(accountAddressStr);

    if (!accountAddress) {
      return {
        success: false,
        error: "Invalid account address format",
      };
    }

    // Generate a random ID for the account using crypto secure random
    const randomBytes = await getRandomBytesAsync(16); // 16 bytes = 128 bits
    const accountId = uint8ArrayToBase64(randomBytes).replace(/[/+=]/g, ""); // Create URL-safe ID

    // Get the canonical string representation of the account address
    const addressString = accountAddressStr; // This should be the blockchain address (0x...)

    console.log("Creating account with ID:", accountId);
    console.log("Using blockchain address:", addressString);

    // Create account state
    const account: AccountState = {
      id: accountId,                         // Random UUID for internal use
      account_address: addressString,        // The actual blockchain address (0x...)
      nickname: nickname.trim() || addressString.substring(0, 8) + "...",
      is_key_stored: false,
      balance_locked: 0,
      balance_unlocked: 0,
      last_update: Date.now(),
    };

    // Add account to selected profile
    const success = addAccountToProfile(profileName, account);

    if (success) {
      // Set as active account if there is no active account yet
      if (appConfig.activeAccountId.get() === null) {
        setActiveAccount(account.id);
      }

      return {
        success: true,
        account,
      };
    } else {
      return {
        success: false,
        error:
          "Account already exists in this profile or profile doesn't exist.",
      };
    }
  } catch (error) {
    console.error("Failed to create account:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}
