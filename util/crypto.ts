/**
 * Simple encryption/decryption utility for securing data with a PIN.
 * Note: In a production app, you would use a more robust crypto library.
 */

/**
 * Encrypts a string value using a PIN as the encryption key.
 * Uses a simple XOR-based encryption for demonstration purposes.
 *
 * @param value - The string to encrypt
 * @param pin - The PIN to use as encryption key
 * @returns The encrypted string in base64 format
 */
export function encryptWithPin(value: string, pin: string): string {
  if (!value) return '';

  // Create a repeating key from the PIN
  const key = createRepeatingKey(pin, value.length);

  // XOR each character with the corresponding key character
  let encrypted = '';
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }

  // Convert to base64 for safe storage
  return btoa(encrypted);
}

/**
 * Decrypts a string value that was encrypted with a PIN.
 *
 * @param encryptedValue - The encrypted string in base64 format
 * @param pin - The PIN used for encryption
 * @returns The decrypted string
 */
export function decryptWithPin(encryptedValue: string, pin: string): string {
  if (!encryptedValue) return '';

  try {
    // Convert from base64
    const encrypted = atob(encryptedValue);

    // Create a repeating key from the PIN
    const key = createRepeatingKey(pin, encrypted.length);

    // XOR each character with the corresponding key character
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
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
  let key = '';
  while (key.length < length) {
    key += pin;
  }
  return key.substring(0, length);
}
