import { deleteValue } from "./secure-store";
import { deleteAccount } from "./app-config-store";

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
    // Step 1: Remove mnemonic from secure storage
    // The mnemonic is stored with the key pattern `account_${accountId}`
    const mnemonicKey = `account_${accountId}`;

    try {
      await deleteValue(mnemonicKey);
      console.log(`Deleted mnemonic for account ${accountId}`);
    } catch (error) {
      console.warn(`Failed to delete mnemonic for account ${accountId}:`, error);
      // Continue with deletion even if mnemonic deletion fails
      // (might not exist or already deleted)
    }

    // Step 2 & 3: Delete account data and remove from profile
    const configDeleteSuccess = deleteAccount(accountId);

    if (!configDeleteSuccess) {
      console.error(`Failed to delete account ${accountId} from config`);
      return false;
    }

    console.log(`Successfully deleted account ${accountId} completely`);
    return true;
  } catch (error) {
    console.error(`Error during complete account deletion for ${accountId}:`, error);
    return false;
  }
}
