/**
 * PIN Rotation Utilities
 *
 * Handles the complete PIN rotation workflow, including re-encrypting
 * all account data with the new PIN.
 */

import { appConfig } from "./app-config-store";
import { getAllKeys, getValue, saveValue, deleteValue } from "./secure-store";
import {
  secureDecryptWithPin,
  secureEncryptWithPin,
  hashPin,
} from "./pin-security";
import { reportErrorAuto } from "./error-utils";
import { getAccountStorageKey } from "./key-obfuscation";

interface AccountWithStoredData {
  accountId: string;
  profileName: string;
  nickname?: string;
  accountAddress: string;
}

export interface PinRotationProgress {
  total: number;
  completed: number;
  current?: string; // current account being processed
  failed: string[]; // list of account IDs that failed
}

interface PinRotationResult {
  success: boolean;
  rotatedCount: number;
  failedAccounts: string[];
  error?: string;
}

/**
 * Gets all accounts that have stored encrypted data in secure storage
 */
export async function getAllAccountsWithStoredData(): Promise<
  AccountWithStoredData[]
> {
  try {
    const profiles = appConfig.profiles.get();
    const results: AccountWithStoredData[] = [];

    for (const [profileName, profile] of Object.entries(profiles)) {
      for (const account of profile.accounts) {
        const legacyKey = `account_${account.id}`;
        let hasData = false;
        try {
          const legacyVal = await getValue(legacyKey);
          if (legacyVal) {
            hasData = true;
          } else {
            const obfKey = await getAccountStorageKey(account.id);
            const obfVal = await getValue(obfKey);
            hasData = obfVal !== null;
          }
        } catch {
          // ignore per-account errors
        }
        if (hasData) {
          results.push({
            accountId: account.id,
            profileName,
            nickname: account.nickname,
            accountAddress: account.account_address,
          });
        }
      }
    }
    return results;
  } catch (error) {
    console.error("Error getting accounts with stored data:", error);
    reportErrorAuto("getAllAccountsWithStoredData", error);
    return [];
  }
}

/**
 * Rotates the PIN and re-encrypts all account data
 */
export async function rotatePinAndReencryptData(
  oldPin: string,
  newPin: string,
  onProgress?: (progress: PinRotationProgress) => void,
): Promise<PinRotationResult> {
  try {
    // First, get all accounts with stored data
    const accountsWithData = await getAllAccountsWithStoredData();

    if (accountsWithData.length === 0) {
      // No data to re-encrypt, just update the PIN
      const hashedPin = await hashPin(newPin);
      await saveValue("user_pin", JSON.stringify(hashedPin));

      return {
        success: true,
        rotatedCount: 0,
        failedAccounts: [],
      };
    }

    const progress: PinRotationProgress = {
      total: accountsWithData.length,
      completed: 0,
      failed: [],
    };

    // Report initial progress
    onProgress?.(progress);

    // Re-encrypt each account's data
    for (const account of accountsWithData) {
      try {
        progress.current = account.accountAddress;
        onProgress?.(progress);

        const success = await reencryptAccountData(
          account.accountId,
          oldPin,
          newPin,
        );

        if (success) {
          progress.completed++;
        } else {
          progress.failed.push(account.accountId);
        }

        onProgress?.(progress);
      } catch (error) {
        console.error(
          `Failed to re-encrypt data for account ${account.accountId}:`,
          error,
        );
        progress.failed.push(account.accountId);
        onProgress?.(progress);
      }
    }

    // Update the stored PIN hash with the new PIN
    const hashedPin = await hashPin(newPin);
    await saveValue("user_pin", JSON.stringify(hashedPin));

    return {
      success: progress.failed.length === 0,
      rotatedCount: progress.completed,
      failedAccounts: progress.failed,
    };
  } catch (error) {
    console.error("Error during PIN rotation:", error);
    reportErrorAuto("rotatePinAndReencryptData", error);

    return {
      success: false,
      rotatedCount: 0,
      failedAccounts: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Re-encrypts a single account's data with the new PIN
 */
async function reencryptAccountData(
  accountId: string,
  oldPin: string,
  newPin: string,
): Promise<boolean> {
  try {
    const legacyKey = `account_${accountId}`;
    let sourceKey: string | null = null;
    let encryptedData: string | null = await getValue(legacyKey);
    if (encryptedData) {
      sourceKey = legacyKey;
    } else {
      const obfKey = await getAccountStorageKey(accountId);
      encryptedData = await getValue(obfKey);
      if (encryptedData) {
        sourceKey = obfKey;
      }
    }

    if (!sourceKey || !encryptedData) {
      console.warn(`No encrypted data found for account ${accountId}`);
      return true;
    }
    if (!encryptedData) {
      console.warn(`No encrypted data found for account ${accountId}`);
      return true; // No data to re-encrypt is not a failure
    }

    // Decrypt with old PIN
    const decryptResult = await secureDecryptWithPin(encryptedData, oldPin);
    if (!decryptResult || !decryptResult.verified) {
      console.error(
        `Failed to decrypt data for account ${accountId} with old PIN`,
      );
      return false;
    }

    // Re-encrypt with new PIN
    const newEncryptedData = await secureEncryptWithPin(
      decryptResult.value,
      newPin,
    );
    if (!newEncryptedData) {
      console.error(
        `Failed to encrypt data for account ${accountId} with new PIN`,
      );
      return false;
    }

    // Determine target (always obfuscated) key
    const targetKey = await getAccountStorageKey(accountId);
    await saveValue(targetKey, newEncryptedData);

    // If we migrated from legacy key, delete it
    if (sourceKey === legacyKey && targetKey !== legacyKey) {
      try {
        await deleteValue(legacyKey);
      } catch {
        // Non-fatal: legacy key deletion failure. Data already migrated to obfuscated key.
      }
    }

    console.log(`Successfully re-encrypted data for account ${accountId}`);
    return true;
  } catch (error) {
    console.error(`Error re-encrypting account ${accountId}:`, error);
    reportErrorAuto("reencryptAccountData", error, { accountId });
    return false;
  }
}

/**
 * Validates that the old PIN can decrypt existing data before rotation
 */
export async function validateOldPinCanDecryptData(oldPin: string): Promise<{
  isValid: boolean;
  testedAccounts: number;
  error?: string;
}> {
  try {
    const accountsWithData = await getAllAccountsWithStoredData();

    if (accountsWithData.length === 0) {
      return { isValid: true, testedAccounts: 0 };
    }

    // Test the old PIN on a few accounts to make sure it works
    const accountsToTest = accountsWithData.slice(
      0,
      Math.min(3, accountsWithData.length),
    );

    for (const account of accountsToTest) {
      const legacyKey = `account_${account.accountId}`;
      let encryptedData = await getValue(legacyKey);
      if (!encryptedData) {
        const obfKey = await getAccountStorageKey(account.accountId);
        encryptedData = await getValue(obfKey);
      }

      if (encryptedData) {
        const decryptResult = await secureDecryptWithPin(encryptedData, oldPin);
        if (!decryptResult || !decryptResult.verified) {
          return {
            isValid: false,
            testedAccounts: accountsToTest.length,
            error: `Cannot decrypt data for account ${account.accountId}`,
          };
        }
      }
    }

    return { isValid: true, testedAccounts: accountsToTest.length };
  } catch (error) {
    console.error("Error validating old PIN:", error);
    return {
      isValid: false,
      testedAccounts: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Debug function to test storage key discovery
 */
export async function debugStorageKeys(): Promise<void> {
  try {
    console.log("=== DEBUG: Storage Key Discovery ===");

    // First rebuild the keys list to make sure it's up to date
    console.log("Rebuilding keys list...");
    const { rebuildKeysList } = await import("./secure-store");
    await rebuildKeysList();

    const allKeys = await getAllKeys();
    console.log("All keys in storage:", allKeys);

    const accountKeys = allKeys.filter(
      (key) => key.startsWith("account_") || key.startsWith("obf_"),
    );

    const profiles = appConfig.profiles.get();
    console.log("Current profiles config:", profiles);

    // Test each account key
    for (const key of accountKeys) {
      let accountId = key;
      if (key.startsWith("account_")) {
        accountId = key.replace("account_", "");
      } else if (key.startsWith("obf_")) {
        // Cannot directly derive accountId from obfuscated key; skip mapping here
        console.log(`Obfuscated key detected: ${key}`);
      }
      console.log(`Testing key: ${key} -> derived ID: ${accountId}`);

      const data = await getValue(key);
      console.log(`Data exists for ${key}:`, data !== null);

      // Look for this account in profiles
      let found = false;
      for (const [profileName, profile] of Object.entries(profiles)) {
        const account = profile.accounts.find((acc) => acc.id === accountId);
        if (account) {
          console.log(
            `Found account ${accountId} in profile ${profileName}:`,
            account,
          );
          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`Account ${accountId} not found in any profile!`);
      }
    }

    console.log("=== END DEBUG ===");
  } catch (error) {
    console.error("Error in debugStorageKeys:", error);
  }
}
