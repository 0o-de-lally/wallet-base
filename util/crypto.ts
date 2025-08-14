/**
 * Secure encryption/decryption utility using @noble/ciphers for AES encryption.
 * This implementation uses Uint8Array for all binary data handling and per-record salts.
 *
 * Security improvements:
 * - Per-record random salt (eliminates rainbow table attacks)
 * - Increased PBKDF2 iterations (100k vs 10k)
 * - Removed static integrity token (relies on AES-GCM authentication)
 * - Cleaner error handling and logging
 */
import { gcm } from "@noble/ciphers/aes";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";
import { getRandomBytes } from "./random";

// Number of iterations for PBKDF2 (increased for better security)
const PBKDF2_ITERATIONS = 100000;
// AES key length in bytes
const AES_KEY_LENGTH = 32; // 256 bits

/**
 * Generates a secure key from a PIN using PBKDF2 with SHA-256
 *
 * @param pinData - The PIN as Uint8Array
 * @param salt - The salt for key derivation as Uint8Array
 * @returns Promise resolving to a key suitable for AES encryption
 */
async function generateKeyFromPin(
  pinData: Uint8Array,
  salt: Uint8Array,
): Promise<Uint8Array> {
  // Use PBKDF2 for secure key derivation with provided salt
  return pbkdf2(sha256, pinData, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: AES_KEY_LENGTH,
  });
}

/**
 * Encrypts a string value using a PIN.
 * Uses AES-GCM from @noble/ciphers for secure encryption with per-record salt.
 *
 * @param value - The data to encrypt as Uint8Array
 * @param pin - The PIN as Uint8Array
 * @returns Promise resolving to the encrypted data as Uint8Array (salt + nonce + ciphertext)
 */
export async function encryptWithPin(
  value: Uint8Array,
  pin: Uint8Array,
): Promise<Uint8Array> {
  if (!value || value.length === 0) return new Uint8Array(0);

  try {
    // Generate a random salt for this encryption (16 bytes)
    const salt = getRandomBytes(16);

    // Generate a key from the PIN and salt
    const keyBytes = await generateKeyFromPin(pin, salt);

    // Generate a random nonce/IV using our random utility
    const nonce = getRandomBytes(12); // 12-byte nonce is standard for GCM

    // Use AES-GCM for authenticated encryption
    const cipher = gcm(keyBytes, nonce);
    const ciphertext = cipher.encrypt(value);

    // Combine salt + nonce + ciphertext for storage
    const result = new Uint8Array(
      salt.length + nonce.length + ciphertext.length,
    );
    result.set(salt, 0);
    result.set(nonce, salt.length);
    result.set(ciphertext, salt.length + nonce.length);

    return result;
  } catch (e) {
    console.error(
      "Encryption error:",
      e instanceof Error ? e.message : String(e),
    );
    return new Uint8Array(0);
  }
}

/**
 * Decrypts a value that was encrypted with a PIN.
 * Uses AES-GCM authentication tag for integrity verification.
 *
 * @param encryptedValue - The encrypted data as Uint8Array (salt + nonce + ciphertext)
 * @param pin - The PIN as Uint8Array
 * @returns Promise resolving to an object with the decrypted data and verification status,
 *          or null if decryption fails
 */
export async function decryptWithPin(
  encryptedValue: Uint8Array,
  pin: Uint8Array,
): Promise<{ value: Uint8Array; verified: boolean } | null> {
  if (!encryptedValue || encryptedValue.length < 28) {
    // 16 (salt) + 12 (nonce) minimum
    return null;
  }

  try {
    // Extract salt (first 16 bytes), nonce (next 12 bytes), and ciphertext (rest)
    const salt = encryptedValue.slice(0, 16);
    const nonce = encryptedValue.slice(16, 28);
    const ciphertext = encryptedValue.slice(28);

    // Generate key from PIN and extracted salt
    const keyBytes = await generateKeyFromPin(pin, salt);

    // Create AES-GCM decipher
    const decipher = gcm(keyBytes, nonce);

    // Decrypt data - AES-GCM will verify integrity automatically
    let decryptedBytes;
    try {
      decryptedBytes = decipher.decrypt(ciphertext);
    } catch (e) {
      // AES-GCM authentication failed - wrong PIN or corrupted data
      return { value: new Uint8Array(0), verified: false };
    }

    // If we reach here, AES-GCM authentication passed
    return { value: decryptedBytes, verified: true };
  } catch (error) {
    console.error(
      "Decryption error:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Helper functions for string conversion.
 * These are provided for convenience to convert between string and Uint8Array.
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Helper functions for base64 encoding/decoding with Uint8Array
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

export function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
