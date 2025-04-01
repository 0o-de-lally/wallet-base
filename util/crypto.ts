/**
 * Simple encryption/decryption utility for securing data with a PIN.
 * Note: In a production app, you would use a more robust crypto library.
 */

// Add a verification token to check if decryption was successful
const INTEGRITY_CHECK = "VALID_DECRYPTION_TOKEN_123";

/**
 * Encrypts a string value using a PIN as the encryption key.
 * Uses a simple XOR-based encryption for demonstration purposes.
 *
 * @param value - The string to encrypt
 * @param pin - The PIN to use as encryption key
 * @returns The encrypted string in base64 format
 */
export function encryptWithPin(value: string, pin: string): string {
  if (!value) return "";

  // Add integrity check to the value before encryption
  const valueWithCheck = value + "|" + INTEGRITY_CHECK;

  // Create a repeating key from the PIN
  const key = createRepeatingKey(pin, valueWithCheck.length);

  // XOR each character with the corresponding key character
  let encrypted = "";
  for (let i = 0; i < valueWithCheck.length; i++) {
    const charCode =
      valueWithCheck.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }

  // Convert to base64 for safe storage
  return btoa(encrypted);
}

/**
 * Decrypts a string value that was encrypted with a PIN.
 * Includes integrity verification to confirm correct PIN was used.
 *
 * @param encryptedValue - The encrypted string in base64 format
 * @param pin - The PIN used for encryption
 * @returns An object with the decrypted string and verification status,
 *          or null if decryption fails or verification fails
 */
export function decryptWithPin(
  encryptedValue: string,
  pin: string,
): { value: string; verified: boolean } | null {
  if (!encryptedValue) return null;

  try {
    // Convert from base64
    const encrypted = atob(encryptedValue);

    // Create a repeating key from the PIN
    const key = createRepeatingKey(pin, encrypted.length);

    // XOR each character with the corresponding key character
    let decrypted = "";
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }

    // Check integrity by looking for the verification token
    const parts = decrypted.split("|");
    const lastPart = parts[parts.length - 1];

    if (lastPart === INTEGRITY_CHECK) {
      // Remove the integrity check from the decrypted value
      const verifiedValue = parts.slice(0, -1).join("|");
      return { value: verifiedValue, verified: true };
    } else {
      // Integrity check failed - wrong PIN used
      return { value: "", verified: false };
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

/**
 * Creates a repeating key from the PIN of the specified length.
 *
 * @param pin - The PIN to use as the base
 * @param length - The desired length of the key
 * @returns A key string of the specified length
 */
function createRepeatingKey(pin: string, length: number): string {
  // Repeat the PIN until it's long enough
  let key = "";
  while (key.length < length) {
    key += pin;
  }
  return key.substring(0, length);
}
