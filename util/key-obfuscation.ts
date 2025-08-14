/**
 * Storage Key Obfuscation Module
 *
 * Implements secure key name obfuscation to prevent enumeration attacks.
 * Uses SHA-256 hashing with device-specific salt to generate unpredictable
 * storage key names.
 */

import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { getValue, saveValue } from "./secure-store";
import { getRandomBytes } from "./random";

const DEVICE_SALT_KEY = "device_salt_2025";
const KEY_MAPPING_PREFIX = "key_mapping_";

/**
 * Gets or creates the device-specific salt for key obfuscation
 */
async function getDeviceSalt(): Promise<Uint8Array> {
  try {
    const existingSalt = await getValue(DEVICE_SALT_KEY);
    if (existingSalt) {
      return Uint8Array.from(atob(existingSalt), (c) => c.charCodeAt(0));
    }
  } catch {
    console.warn("Could not retrieve existing device salt, generating new one");
  }

  // Generate new device salt
  const newSalt = getRandomBytes(32);
  try {
    await saveValue(DEVICE_SALT_KEY, btoa(String.fromCharCode(...newSalt)));
  } catch (error) {
    console.error("Failed to save device salt:", error);
    // Continue with in-memory salt for this session
  }

  return newSalt;
}

/**
 * Generates an obfuscated storage key name
 * @param originalKey - The original key name (e.g., "account_123")
 * @param keyType - The type of key for additional entropy (e.g., "account", "pin", "config")
 * @returns Obfuscated key name
 */
export async function obfuscateKey(
  originalKey: string,
  keyType: string = "data",
): Promise<string> {
  const deviceSalt = await getDeviceSalt();

  // Create input for hashing: deviceSalt + originalKey + keyType
  const encoder = new TextEncoder();
  const originalKeyBytes = encoder.encode(originalKey);
  const keyTypeBytes = encoder.encode(keyType);

  // Combine all inputs
  const combined = new Uint8Array(
    deviceSalt.length + originalKeyBytes.length + keyTypeBytes.length,
  );
  combined.set(deviceSalt, 0);
  combined.set(originalKeyBytes, deviceSalt.length);
  combined.set(keyTypeBytes, deviceSalt.length + originalKeyBytes.length);

  // Hash the combined input
  const hash = sha256(combined);

  // Use first 16 bytes of hash as obfuscated key (32 hex characters)
  const obfuscatedKey = bytesToHex(hash.slice(0, 16));

  return `obf_${obfuscatedKey}`;
}

/**
 * Stores a mapping between original and obfuscated keys (encrypted)
 * This is used for key recovery during migration or debugging
 * @public API - Used for debugging and manual recovery scenarios
 */
export async function storeLegacyKeyMapping(
  originalKey: string,
  obfuscatedKey: string,
): Promise<void> {
  try {
    const mappingKey = `${KEY_MAPPING_PREFIX}${originalKey}`;
    await saveValue(mappingKey, obfuscatedKey);
  } catch (error) {
    console.error("Failed to store key mapping:", error);
    // Non-critical for security, continue operation
  }
}

/**
 * Retrieves the obfuscated key for a legacy original key
 * @internal - Used for debugging and manual recovery scenarios
 * Currently unused but kept for potential debugging needs
 */
/*
async function getLegacyKeyMapping(
  originalKey: string,
): Promise<string | null> {
  try {
    const mappingKey = `${KEY_MAPPING_PREFIX}${originalKey}`;
    return await getValue(mappingKey);
  } catch (error) {
    console.error("Failed to retrieve key mapping:", error);
    return null;
  }
}
*/

/**
 * Migrates a value from a predictable key to an obfuscated key
 * @param originalKey - The current predictable key name
 * @param keyType - The type of key for obfuscation
 * @returns The new obfuscated key name, or null if migration failed
 */
export async function migrateToObfuscatedKey(
  originalKey: string,
  keyType: string = "data",
): Promise<string | null> {
  try {
    // Check if value exists under original key
    const value = await getValue(originalKey);
    if (!value) {
      return null; // Nothing to migrate
    }

    // Generate obfuscated key
    const obfuscatedKey = await obfuscateKey(originalKey, keyType);

    // Store value under new key
    await saveValue(obfuscatedKey, value);

    // Store mapping for potential recovery
    await storeLegacyKeyMapping(originalKey, obfuscatedKey);

    // Delete original key
    const { deleteValue } = await import("./secure-store");
    await deleteValue(originalKey);

    console.log(`Migrated key: ${originalKey} -> ${obfuscatedKey}`);
    return obfuscatedKey;
  } catch (error) {
    console.error(`Failed to migrate key ${originalKey}:`, error);
    return null;
  }
}

/**
 * Helper function to get account storage key with obfuscation
 * @param accountId - The account identifier
 * @returns Obfuscated account key
 */
export async function getAccountStorageKey(accountId: string): Promise<string> {
  const originalKey = `account_${accountId}`;
  return await obfuscateKey(originalKey, "account");
}

/**
 * Helper function to get PIN storage key with obfuscation
 * @returns Obfuscated PIN key
 */
export async function getPinStorageKey(): Promise<string> {
  return await obfuscateKey("user_pin", "pin");
}
