import { deleteValue, getValue } from "./secure-store";
import { deleteAccount } from "./app-config-store";
import { getAccountStorageKey } from "./key-obfuscation";

import { secureLog, secureError } from "./error-utils";

/**
 * Completely deletes an account, including:
 * 1. Removing any mnemonics associated with that account from secure storage
 * 2. Deleting account data from the app config
 * 3. Removing the account from the profile
 *
 * @param accountId ID of the account to delete
 * @returns Promise<boolean> indicating success or failure
 */
export async function deleteAccountCompletely(
  accountId: string,
): Promise<boolean> {
  try {
    // Step 1: Remove mnemonic from secure storage (handle legacy & obfuscated)
    const legacyKey = `account_${accountId}`;
    const obfKey = await getAccountStorageKey(accountId);

    for (const key of [legacyKey, obfKey]) {
      try {
        const existing = await getValue(key);
        if (existing) {
          await deleteValue(key);
          secureLog(
            `Deleted stored secret for account ${accountId} (key=${key})`,
          );
        }
      } catch (error) {
        secureError(
          `Failed to delete key ${key} for account ${accountId}:`,
          error,
        );
      }
    }

    // Step 2 & 3: Delete account data and remove from profile
    const configDeleteSuccess = deleteAccount(accountId);

    if (!configDeleteSuccess) {
      secureError(`Failed to delete account ${accountId} from config`);
      return false;
    }

    secureLog(`Successfully deleted account ${accountId} completely`);
    return true;
  } catch (error) {
    secureError(
      `Error during complete account deletion for ${accountId}:`,
      error,
    );
    return false;
  }
}
