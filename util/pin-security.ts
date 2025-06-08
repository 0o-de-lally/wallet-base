/**
 * PIN Security Module
 *
 * This module implements PIN handling with current Expo/React Native constraints in mind.
 * It balances security and cross-platform compatibility within the existing toolchain.
 *
 * Current approach:
 * - Uses JavaScript cryptographic libraries (@noble/hashes) for PBKDF2 implementation
 *   as Expo doesn't provide direct OS-level keychain access for cryptographic operations
 * - Implements best practices within JS constraints (constant-time comparisons,
 *   proper key derivation with salt and iterations)
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
 * - Cryptographic operations (PBKDF2, hash comparisons) happen in JavaScript
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
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { getRandomBytes } from "./random";
import { constantTimeEqual } from "./security-utils";
import { getValue } from "./secure-store";
import {
  encryptWithPin as cryptoEncryptWithPin,
  decryptWithPin as cryptoDecryptWithPin,
  stringToUint8Array,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "./crypto";

// Define a custom type for the hashed PIN
export type HashedPin = {
  salt: string;
  hash: string;
  iterations: number;
};

/**
 * Validates a PIN format.
 * @param pin The PIN to validate
 * @returns true if the PIN is valid (6 digits), false otherwise
 */
export function validatePin(pin: string): boolean {
  // PIN must be exactly 6 digits
  return /^\d{6}$/.test(pin);
}

/**
 * Hashes a PIN with PBKDF2 using salt and multiple iterations for security.
 * PBKDF2 is specifically designed for password hashing and is more resistant to
 * brute force attacks than simple hash algorithms.
 *
 * @param pin The PIN to hash
 * @param iterations Number of PBKDF2 iterations for key stretching (default: 10000)
 * @returns The hashed PIN with salt and iteration info
 */
export async function hashPin(
  pin: string,
  iterations = 10000,
): Promise<HashedPin> {
  try {
    // Generate a random salt (16 bytes)
    const saltBytes = getRandomBytes(16);
    const salt = bytesToHex(saltBytes);

    // Use Noble's PBKDF2 implementation to derive a key from the PIN
    const encoder = new TextEncoder();
    const pinBytes = encoder.encode(pin);
    const derivedKey = pbkdf2(sha256, pinBytes, hexToBytes(salt), {
      c: iterations,
      dkLen: 32, // 32 bytes = 256 bits
    });

    // Convert to hex string
    const hash = bytesToHex(derivedKey);

    return {
      salt,
      hash,
      iterations,
    };
  } catch (error) {
    console.error("Error hashing PIN:", error);
    throw new Error("Failed to hash PIN");
  }
}

/**
 * Securely compares two hashed PINs using constant-time comparison.
 * @param storedHashedPin Stored hashed PIN
 * @param inputPin Raw PIN input to verify
 * @returns Promise resolving to true if the PINs match, false otherwise
 */
export async function comparePins(
  storedHashedPin: HashedPin,
  inputPin: string,
): Promise<boolean> {
  try {
    // Generate hash from input PIN using the same salt and iterations
    const encoder = new TextEncoder();
    const pinBytes = encoder.encode(inputPin);
    const derivedKey = pbkdf2(
      sha256,
      pinBytes,
      hexToBytes(storedHashedPin.salt),
      {
        c: storedHashedPin.iterations,
        dkLen: 32, // 32 bytes = 256 bits
      },
    );

    const hash = bytesToHex(derivedKey);

    // Use our constant-time comparison utility
    return constantTimeEqual(hash, storedHashedPin.hash);
  } catch (error) {
    console.error("Error comparing PINs:", error);
    return false;
  }
}

/**
 * Processes a PIN operation securely, minimizing PIN retention in memory
 * This function acts as a wrapper that handles PIN cleanup after use
 *
 * @param pin - The PIN to use for the operation
 * @param operation - Callback function that receives the PIN and performs an operation
 * @returns Promise resolving to the result of the operation
 */
export async function processWithPin<T>(
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
 * Verifies a PIN against the stored hashed PIN
 * @param pin - The PIN to verify (will be cleared after use)
 * @returns Promise resolving to boolean indicating if PIN is valid
 */
export async function verifyStoredPin(pin: string): Promise<boolean> {
  return processWithPin(pin, async (securePin) => {
    try {
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        return false;
      }

      // Parse the stored PIN from JSON
      const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

      // Verify PIN
      return await comparePins(storedHashedPin, securePin);
    } catch (error) {
      console.error(
        "PIN verification error:",
        error instanceof Error ? error.message : String(error),
      );
      console.warn("Error verifying PIN, returning false for safety");
      return false;
    }
  });
}

/**
 * Encrypts data with PIN and returns result without storing PIN in memory
 * @param data - The data to encrypt
 * @param pin - The PIN to use (will be cleared after use)
 * @returns Promise resolving to the encrypted data as base64 string
 */
export async function secureEncryptWithPin(
  data: string,
  pin: string,
): Promise<string> {
  return processWithPin(pin, async (securePin) => {
    try {
      // Convert to Uint8Arrays for processing
      const dataBytes = stringToUint8Array(data);
      const pinBytes = stringToUint8Array(securePin);

      // Encrypt the data using the crypto module implementation
      const encryptedBytes = await cryptoEncryptWithPin(dataBytes, pinBytes);

      // Convert to base64 for storage
      return uint8ArrayToBase64(encryptedBytes);
    } catch (error) {
      console.error("Encryption error:", error);
      return "";
    }
  });
}

/**
 * Decrypts data with PIN and returns result without storing PIN in memory
 * @param encryptedData - The encrypted data as base64 string
 * @param pin - The PIN to use (will be cleared after use)
 * @returns Promise resolving to object with decrypted value and verification status
 */
export async function secureDecryptWithPin(
  encryptedData: string,
  pin: string,
): Promise<{ value: string; verified: boolean } | null> {
  return processWithPin(pin, async (securePin) => {
    try {
      // Convert from base64 to Uint8Array
      const encryptedBytes = base64ToUint8Array(encryptedData);

      // Convert PIN to Uint8Array
      const pinBytes = stringToUint8Array(securePin);

      // Decrypt with PIN using the crypto module implementation
      const result = await cryptoDecryptWithPin(encryptedBytes, pinBytes);

      if (!result) {
        return null;
      }

      // Convert decrypted bytes to string
      const decryptedValue = new TextDecoder().decode(result.value);

      return {
        value: decryptedValue,
        verified: result.verified,
      };
    } catch (error) {
      // Log a more helpful error message without exposing sensitive data
      console.warn("Decryption failed - possibly due to incorrect PIN", error);
      // Return null instead of re-throwing to allow for graceful error handling
      return null;
    }
  });
}
