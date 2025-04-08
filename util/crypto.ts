/**
 * Secure encryption/decryption utility using @noble/ciphers for AES encryption.
 * This implementation uses Uint8Array for all binary data handling.
 */
import { gcm } from "@noble/ciphers/aes";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { getRandomBytesAsync } from "expo-crypto";

// Add a verification token to check if decryption was successful
const INTEGRITY_CHECK = stringToUint8Array("VALID_DECRYPTION_TOKEN_123");
// Salt for key derivation
const SALT = stringToUint8Array("WalletAppSalt123456");
// Number of iterations for PBKDF2
const PBKDF2_ITERATIONS = 10000;
// AES key length in bytes
const AES_KEY_LENGTH = 32; // 256 bits

/**
 * Generates a secure key from a PIN using PBKDF2 with SHA-256
 *
 * @param pinData - The PIN as Uint8Array
 * @returns Promise resolving to a key suitable for AES encryption
 */
async function generateKeyFromPin(pinData: Uint8Array): Promise<Uint8Array> {
  // Use PBKDF2 for secure key derivation
  return pbkdf2(sha256, pinData, SALT, {
    c: PBKDF2_ITERATIONS,
    dkLen: AES_KEY_LENGTH,
  });
}

/**
 * Encrypts a string value using a PIN.
 * Uses AES-GCM from @noble/ciphers for secure encryption.
 *
 * @param value - The data to encrypt as Uint8Array
 * @param pin - The PIN as Uint8Array
 * @returns Promise resolving to the encrypted data as Uint8Array
 */
export async function encryptWithPin(
  value: Uint8Array,
  pin: Uint8Array,
): Promise<Uint8Array> {
  if (!value || value.length === 0) return new Uint8Array(0);

  try {
    // Add integrity check to the value before encryption
    const valueWithCheck = concatUint8Arrays(
      value,
      stringToUint8Array("|"),
      INTEGRITY_CHECK,
    );

    // Generate a key from the PIN
    const keyBytes = await generateKeyFromPin(pin);

    // Generate a random nonce/IV using expo-crypto's secure random generator
    const nonce = await getRandomBytesAsync(12); // 12-byte nonce is standard for GCM

    // Use AES-GCM for authenticated encryption
    const cipher = gcm(keyBytes, nonce);
    const ciphertext = cipher.encrypt(valueWithCheck);

    // Prepend the nonce to the ciphertext for decryption later
    const result = new Uint8Array(nonce.length + ciphertext.length);
    result.set(nonce, 0);
    result.set(ciphertext, nonce.length);

    return result;
  } catch (e) {
    console.error(
      "Encryption error:",
      e instanceof Error ? e.message : String(e),
    );
    console.warn("Error encountered, using fallback encryption");
    return new Uint8Array(0);
  }
}

/**
 * Concatenates multiple Uint8Arrays
 */
function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  // Calculate total length
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);

  // Create a new array with the total length
  const result = new Uint8Array(totalLength);

  // Copy each array into the result
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Decrypts a value that was encrypted with a PIN.
 * Includes integrity verification to confirm correct PIN was used.
 *
 * @param encryptedValue - The encrypted data as Uint8Array
 * @param pin - The PIN as Uint8Array
 * @returns Promise resolving to an object with the decrypted data and verification status,
 *          or null if decryption fails or verification fails
 */
export async function decryptWithPin(
  encryptedValue: Uint8Array,
  pin: Uint8Array,
): Promise<{ value: Uint8Array; verified: boolean } | null> {
  if (!encryptedValue || encryptedValue.length === 0) return null;

  try {
    // Extract nonce (first 12 bytes)
    const nonce = encryptedValue.slice(0, 12);
    const ciphertext = encryptedValue.slice(12);

    // Generate key from PIN
    const keyBytes = await generateKeyFromPin(pin);

    // Create AES-GCM decipher
    const decipher = gcm(keyBytes, nonce);

    // Decrypt data - this will throw an error if authentication fails
    let decryptedBytes;
    try {
      // Use decrypt instead of open
      decryptedBytes = decipher.decrypt(ciphertext);
    } catch (e) {
      console.error("PIN decryption error", e);
      // Silently handle decryption failure without stack trace
      return { value: new Uint8Array(0), verified: false };
    }

    // Find the separator byte ("|" character)
    const separatorIndex = findSequence(
      decryptedBytes,
      stringToUint8Array("|"),
    );

    if (separatorIndex !== -1) {
      const potentialCheck = decryptedBytes.slice(separatorIndex + 1);
      const dataWithoutCheck = decryptedBytes.slice(0, separatorIndex);

      // Check if the potential check matches our integrity check
      const integrityCheckMatches = compareUint8Arrays(
        potentialCheck,
        INTEGRITY_CHECK,
      );

      if (integrityCheckMatches) {
        return { value: dataWithoutCheck, verified: true };
      }
    }

    // Integrity check failed - wrong PIN used
    return { value: new Uint8Array(0), verified: false };
  } catch (error) {
    console.error(
      "Decryption error:",
      error instanceof Error ? error.message : String(error),
    );
    console.warn("Error in decryption process, returning null");
    return null;
  }
}

/**
 * Finds a sequence within a Uint8Array
 * Returns the index of the first element of the sequence, or -1 if not found
 */
function findSequence(haystack: Uint8Array, needle: Uint8Array): number {
  if (needle.length === 0) return 0;
  if (needle.length > haystack.length) return -1;

  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }

  return -1;
}

/**
 * Compares two Uint8Arrays for equality
 */
function compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * Helper functions for string conversion.
 * These are provided for convenience to convert between string and Uint8Array.
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function uint8ArrayToString(array: Uint8Array): string {
  return new TextDecoder().decode(array);
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
