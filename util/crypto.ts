/**
 * Secure encryption/decryption utility using expo-crypto.
 * This implementation uses Uint8Array for all binary data handling.
 */
import * as Crypto from 'expo-crypto';

// Add a verification token to check if decryption was successful
const INTEGRITY_CHECK = stringToUint8Array("VALID_DECRYPTION_TOKEN_123");

/**
 * Generates a secure key from a PIN using SHA-256
 *
 * @param pinData - The PIN as Uint8Array
 * @returns Promise resolving to a hash that can be used as a key
 */
async function generateKeyFromPin(pinData: Uint8Array): Promise<Uint8Array> {
  // Create a salt
  const salt = stringToUint8Array("WalletAppSalt123456");

  // Combine PIN and salt
  const combinedData = new Uint8Array(pinData.length + salt.length);
  combinedData.set(pinData, 0);
  combinedData.set(salt, pinData.length);

  // Use SHA-256 to create a secure hash
  const hashString = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    uint8ArrayToString(combinedData)
  );

  // Convert hash to Uint8Array
  return stringToUint8Array(hashString);
}

/**
 * Encrypts a string value using a PIN.
 * Uses Uint8Array for efficient binary operations.
 *
 * @param value - The data to encrypt as Uint8Array
 * @param pin - The PIN as Uint8Array
 * @returns Promise resolving to the encrypted data as Uint8Array
 */
export async function encryptWithPin(value: Uint8Array, pin: Uint8Array): Promise<Uint8Array> {
  if (!value || value.length === 0) return new Uint8Array(0);

  try {
    // Add integrity check to the value before encryption
    const valueWithCheck = concatUint8Arrays(value, stringToUint8Array("|"), INTEGRITY_CHECK);

    // Generate a key from the PIN
    const keyBytes = await generateKeyFromPin(pin);

    // Generate a random IV (Initialization Vector)
    const iv = Crypto.getRandomValues(new Uint8Array(16));

    // Create an encryption output buffer
    const encryptedData = new Uint8Array(valueWithCheck.length);

    // XOR each byte with the corresponding key byte and IV for added security
    for (let i = 0; i < valueWithCheck.length; i++) {
      // Combine key byte, IV byte, and a position-dependent value for better encryption
      encryptedData[i] = valueWithCheck[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length] ^ (i & 0xFF);
    }

    // Create a hash of the original data for integrity verification
    const dataHashBytes = await generateIntegrityHash(valueWithCheck, keyBytes);

    // Combine IV + encrypted data + hash into a single buffer
    const resultBuffer = new Uint8Array(iv.length + encryptedData.length + dataHashBytes.length + 2);

    // Store sizes for later decryption (IV size is fixed at 16)
    resultBuffer[0] = encryptedData.length & 0xFF;
    resultBuffer[1] = (encryptedData.length >> 8) & 0xFF;

    // Copy data into the result buffer
    resultBuffer.set(iv, 2);
    resultBuffer.set(encryptedData, 2 + iv.length);
    resultBuffer.set(dataHashBytes, 2 + iv.length + encryptedData.length);

    return resultBuffer;
  } catch (error) {
    console.error("Encryption error:", error);
    return new Uint8Array(0);
  }
}

/**
 * Generates an integrity hash for the data
 */
async function generateIntegrityHash(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const combinedData = concatUint8Arrays(data, key);

  const hashString = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    uint8ArrayToString(combinedData)
  );

  return stringToUint8Array(hashString);
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
  pin: Uint8Array
): Promise<{ value: Uint8Array; verified: boolean } | null> {
  if (!encryptedValue || encryptedValue.length === 0) return null;

  try {
    // Get the data length from the first two bytes
    const dataLength = encryptedValue[0] | (encryptedValue[1] << 8);

    // Extract the IV (16 bytes following the length)
    const iv = encryptedValue.slice(2, 18);

    // Extract the encrypted data
    const encryptedData = encryptedValue.slice(18, 18 + dataLength);

    // Extract the hash
    const storedHashBytes = encryptedValue.slice(18 + dataLength);

    // Generate key from PIN
    const keyBytes = await generateKeyFromPin(pin);

    // Decrypt the data
    const decryptedBytes = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      decryptedBytes[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length] ^ (i & 0xFF);
    }

    // Check integrity by looking for the verification token
    // Find the separator byte ("|" character which is 0x7C in ASCII)
    const separatorIndex = findSequence(decryptedBytes, stringToUint8Array("|"));

    if (separatorIndex !== -1) {
      const potentialCheck = decryptedBytes.slice(separatorIndex + 1);
      const dataWithoutCheck = decryptedBytes.slice(0, separatorIndex);

      // Check if the potential check matches our integrity check
      const integrityCheckMatches = compareUint8Arrays(potentialCheck, INTEGRITY_CHECK);

      // Verify the hash
      const computedHashBytes = await generateIntegrityHash(decryptedBytes, keyBytes);
      const hashesMatch = compareUint8Arrays(computedHashBytes, storedHashBytes);

      if (integrityCheckMatches && hashesMatch) {
        return { value: dataWithoutCheck, verified: true };
      }
    }

    // Integrity check failed - wrong PIN used
    return { value: new Uint8Array(0), verified: false };
  } catch (error) {
    console.error("Decryption error:", error);
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
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
