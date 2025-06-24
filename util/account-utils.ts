import { uint8ArrayToBase64 } from "./crypto";
import { getRandomBytes } from "./random";
import {
  addAccountToProfile,
  setActiveAccount,
  appConfig,
} from "./app-config-store";
import type { AccountState } from "./app-config-store";
import { AccountAddress } from "open-libra-sdk";
import { refreshSetupStatus } from "./setup-state";

/**
 * Creates a new account in the specified profile
 *
 * @param profileName Name of the profile to add the account to
 * @param accountAddress Address of the account (AccountAddress instance)
 * @param nickname Optional nickname for the account
 * @returns Object containing success status, error message (if any), and created account (if successful)
 */
export async function createAccount(
  profileName: string,
  accountAddress: AccountAddress,
  nickname: string,
): Promise<{
  success: boolean;
  error?: string;
  account?: AccountState;
}> {
  try {
    // Validate inputs
    if (!accountAddress) {
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

    // Generate a random ID for the account using crypto secure random
    const randomBytes = getRandomBytes(16); // 16 bytes = 128 bits
    const accountId = uint8ArrayToBase64(randomBytes).replace(/[/+=]/g, ""); // Create URL-safe ID

    // Get string representation for nickname fallback
    const addressString = accountAddress?.toStringLong?.() || "Unknown Address";

    // Create account state
    const account: AccountState = {
      id: accountId,
      account_address: accountAddress.toStringLong(), // Store as string
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

      // Refresh setup status to trigger reactive updates
      refreshSetupStatus();

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
