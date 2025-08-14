/**
 * PIN Security Module
 *
 * This module implements PIN handling with current Expo/React Native constraints in mind.
 * It balances security and cross-platform compatibility within the existing toolchain.
 *
 * Current approach:
 * - Uses JavaScript cryptographic libraries (@noble/hashes) for Scrypt implementation
 *   as Expo doesn't provide direct OS-level keychain access for cryptographic operations
 * - Implements best practices within JS constraints (constant-time comparisons,
 *   proper key derivation with salt and parameters)
 *
 * Security considerations:
 * - No sensitive data is ever stored in plaintext - all secrets are encrypted
 * - All operations involving secrets require explicit PIN entry, separate from the OS
 *   authentication. This is intentionally burdensome but necessary for a crypto wallet
 *   where security cannot be compromised for convenience
 * - The original PIN is never stored anywhere
 * - We minimize PIN retention in memory and attempt to clear sensitive data when possible,
 *   though JavaScript's garbage collection makes this imperfect
 * - We use secure random salt generation via native crypto API (which uses OS-level randomness)
 * - Constant-time comparison prevents timing attacks, though we recognize this is a
 *   secondary defense as most attacks would target the application layer directly
 * - We acknowledge that an attacker with debug access to the device/application can
 *   bypass most client-side protections regardless of implementation details
 *
 * Known limitations:
 * - Cryptographic operations (Scrypt, hash comparisons) happen in JavaScript
 *   rather than at the OS level or in native code
 * - Memory management in JavaScript is not as controllable as in lower-level languages
 * - JavaScript strings are immutable and may leave copies in memory until garbage collection
 *
 * Future improvements:
 * - Move cryptographic operations to OS-level APIs when Expo support improves
 * - Consider native modules (Rust/C++ via JSI) for sensitive cryptographic operations
 * - Evaluate WebAssembly for improved performance and security isolation
 *
 * @module pin_security
 */
import { scrypt } from "@noble/hashes/scrypt";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { gcm } from "@noble/ciphers/aes";
import { getRandomBytes } from "./random";
import { constantTimeEqual } from "./security-utils";
import { getValue, saveValue } from "./secure-store";
import {
  checkLockoutStatus,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from "./pin-rate-limiting";

// Define a custom type for the hashed PIN
type HashedPin = {
  salt: string;
  hash: string;
  N: number; // Scrypt cost parameter
  r: number; // Scrypt block size parameter
  p: number; // Scrypt parallelization parameter
};

// Scrypt parameters for secure PIN hashing (matching crypto.ts)
const SCRYPT_CONFIG = {
  N: 32768, // Cost parameter (32K)
  r: 8, // Block size parameter
  p: 1, // Parallelization parameter
  dkLen: 32, // Derived key length (256 bits)
};

/**
 * Generates a secure key from a PIN using Scrypt (memory-hard function)
 *
 * @param pinData - The PIN as Uint8Array
 * @param salt - The salt for key derivation as Uint8Array
 * @returns Key suitable for AES encryption
 */
function generateKeyFromPin(pinData: Uint8Array, salt: Uint8Array): Uint8Array {
  // Use Scrypt for memory-hard key derivation with provided salt
  return scrypt(pinData, salt, SCRYPT_CONFIG);
}

/**
 * Encrypts data using a PIN.
 * Uses AES-GCM for secure encryption with per-record salt.
 *
 * @param value - The data to encrypt as Uint8Array
 * @param pin - The PIN as Uint8Array
 * @returns The encrypted data as Uint8Array (salt + nonce + ciphertext)
 */
function encryptWithPin(value: Uint8Array, pin: Uint8Array): Uint8Array {
  if (!value || value.length === 0) return new Uint8Array(0);

  try {
    // Generate a random salt for this encryption (16 bytes)
    const salt = getRandomBytes(16);

    // Generate a key from the PIN and salt
    const keyBytes = generateKeyFromPin(pin, salt);

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
 * @returns An object with the decrypted data and verification status,
 *          or null if decryption fails
 */
function decryptWithPin(
  encryptedValue: Uint8Array,
  pin: Uint8Array,
): { value: Uint8Array; verified: boolean } | null {
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
    const keyBytes = generateKeyFromPin(pin, salt);

    // Create AES-GCM decipher
    const decipher = gcm(keyBytes, nonce);

    // Decrypt data - AES-GCM will verify integrity automatically
    let decryptedBytes;
    try {
      decryptedBytes = decipher.decrypt(ciphertext);
    } catch {
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
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ArrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Hashes a PIN using Scrypt for secure storage and verification.
 * @param pin - The PIN to hash
 * @returns Promise resolving to the hashed PIN data
 */
async function hashPin(pin: string): Promise<HashedPin> {
  try {
    // Generate a random salt (16 bytes)
    const saltBytes = getRandomBytes(16);
    const salt = bytesToHex(saltBytes);

    // Use Noble's Scrypt implementation to derive a key from the PIN
    const encoder = new TextEncoder();
    const pinBytes = encoder.encode(pin);
    const derivedKey = scrypt(pinBytes, hexToBytes(salt), SCRYPT_CONFIG);

    // Convert to hex string
    const hash = bytesToHex(derivedKey);

    return {
      salt,
      hash,
      N: SCRYPT_CONFIG.N,
      r: SCRYPT_CONFIG.r,
      p: SCRYPT_CONFIG.p,
    };
  } catch (error) {
    console.error("PIN hashing failed:", error);
    throw new Error("Failed to hash PIN");
  }
}

/**
 * Securely compares two hashed PINs using constant-time comparison.
 * @param storedHashedPin Stored hashed PIN
 * @param inputPin Raw PIN input to verify
 * @returns Promise resolving to true if the PINs match, false otherwise
 */
async function comparePins(
  storedHashedPin: HashedPin,
  inputPin: string,
): Promise<boolean> {
  try {
    // Generate hash from input PIN using the same salt and Scrypt parameters
    const encoder = new TextEncoder();
    const pinBytes = encoder.encode(inputPin);
    const derivedKey = scrypt(pinBytes, hexToBytes(storedHashedPin.salt), {
      N: storedHashedPin.N,
      r: storedHashedPin.r,
      p: storedHashedPin.p,
      dkLen: 32, // 32 bytes = 256 bits
    });

    const hash = bytesToHex(derivedKey);

    // Use constant-time comparison to prevent timing attacks
    return constantTimeEqual(hash, storedHashedPin.hash);
  } catch (error) {
    console.error("PIN comparison failed:", error);
    return false;
  }
}

/**
 * Processes a PIN operation with some memory clearing (limited by JavaScript constraints)
 * @param pin - The PIN to use (will be attempted to be cleared after use)
 * @param operation - The async operation to perform with the PIN
 * @returns Promise resolving to the operation result
 */
async function processWithPin<T>(
  pin: string,
  operation: (pin: string) => Promise<T>,
): Promise<T> {
  try {
    // Execute the operation with the PIN
    return await operation(pin);
  } finally {
    // Best-effort memory clearing within JavaScript's limitations
    // This doesn't guarantee the PIN is fully removed from memory
    // due to JavaScript's garbage collection and string immutability
    pin = "";
  }
}

/**
 * Stores a PIN hash securely after validating it meets requirements
 * @param pin - The PIN to store (will be cleared after use)
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function storePinHash(pin: string): Promise<boolean> {
  return processWithPin(pin, async (securePin) => {
    try {
      // Hash the PIN using Scrypt
      const hashedPin = await hashPin(securePin);

      // Store the hash as JSON in secure storage
      const hashedPinJson = JSON.stringify(hashedPin);
      await saveValue("user_pin", hashedPinJson);

      return true;
    } catch (error) {
      console.error("Failed to store PIN hash:", error);
      return false;
    }
  });
}

/**
 * Validates a PIN against the stored hash with rate limiting
 * @param pin - The PIN to validate (will be cleared after use)
 * @returns Promise resolving to object with validation result and lockout info
 */
export async function validatePinWithRateLimit(pin: string): Promise<{
  isValid: boolean;
  isLockedOut: boolean;
  remainingTime: number;
  attemptsRemaining: number;
}> {
  return processWithPin(pin, async (securePin) => {
    try {
      // Check if we're currently locked out
      const lockoutStatus = await checkLockoutStatus();

      if (lockoutStatus.isLockedOut) {
        return {
          isValid: false,
          isLockedOut: true,
          remainingTime: lockoutStatus.remainingTime,
          attemptsRemaining: 0,
        };
      }

      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        // Record failed attempt for missing PIN
        const newLockoutStatus = await recordFailedAttempt();
        return {
          isValid: false,
          isLockedOut: newLockoutStatus.isLockedOut,
          remainingTime: newLockoutStatus.remainingTime,
          attemptsRemaining: newLockoutStatus.attemptsRemaining,
        };
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Verify PIN using Scrypt comparison
      const isValid = await comparePins(storedHashedPin, securePin);

      if (isValid) {
        // Record successful attempt (clears rate limiting)
        await recordSuccessfulAttempt();
        return {
          isValid: true,
          isLockedOut: false,
          remainingTime: 0,
          attemptsRemaining: 0,
        };
      } else {
        // Record failed attempt
        const newLockoutStatus = await recordFailedAttempt();
        return {
          isValid: false,
          isLockedOut: newLockoutStatus.isLockedOut,
          remainingTime: newLockoutStatus.remainingTime,
          attemptsRemaining: newLockoutStatus.attemptsRemaining,
        };
      }
    } catch (error) {
      console.error("PIN validation failed:", error);
      // On error, record as failed attempt for security
      const newLockoutStatus = await recordFailedAttempt();
      return {
        isValid: false,
        isLockedOut: newLockoutStatus.isLockedOut,
        remainingTime: newLockoutStatus.remainingTime,
        attemptsRemaining: newLockoutStatus.attemptsRemaining,
      };
    }
  });
}

// Export compatibility functions for existing code
export { hashPin };
export const validatePin = validatePinWithRateLimit;
export const verifyStoredPin = validatePinWithRateLimit;

// High-level wrapper functions for data encryption/decryption with PIN
export async function secureEncryptWithPin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  data: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pin: string,
): Promise<string | null> {
  return processWithPin(pin, async (securePin) => {
    try {
      // Convert data to Uint8Array for encryption
      const dataBytes = stringToUint8Array(data);
      const pinBytes = stringToUint8Array(securePin);

      // Encrypt using the internal crypto function
      const encryptedBytes = encryptWithPin(dataBytes, pinBytes);

      if (!encryptedBytes || encryptedBytes.length === 0) {
        console.warn("Encryption failed - empty result");
        return null;
      }

      // Convert to base64 for storage
      return uint8ArrayToBase64(encryptedBytes);
    } catch (error) {
      console.warn("Encryption failed:", error);
      return null;
    }
  });
}

export async function secureDecryptWithPin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  encryptedData: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pin: string,
): Promise<{ value: string; verified: boolean } | null> {
  return processWithPin(pin, async (securePin) => {
    try {
      // Convert from base64 to Uint8Array
      const encryptedBytes = base64ToUint8Array(encryptedData);
      const pinBytes = stringToUint8Array(securePin);

      // Decrypt using the internal crypto function
      const result = decryptWithPin(encryptedBytes, pinBytes);

      if (!result) {
        console.warn("Decryption failed - null result");
        return null;
      }

      if (!result.verified) {
        console.warn("Decryption failed - verification failed");
        return { value: "", verified: false };
      }

      // Convert back to string
      const value = new TextDecoder().decode(result.value);
      return { value, verified: true };
    } catch (error) {
      console.warn("Decryption failed - possibly due to incorrect PIN", error);
      return null;
    }
  });
}

// Export helper functions for compatibility
export { stringToUint8Array, uint8ArrayToBase64, base64ToUint8Array };
export { encryptWithPin, decryptWithPin };
