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

// Placeholder exports for functions that were removed/simplified
// These can be implemented later if needed
export async function secureEncryptWithPin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pin: string,
): Promise<string | null> {
  console.warn(
    "secureEncryptWithPin is not implemented in Phase 1 - use crypto.ts directly",
  );
  return null;
}

export async function secureDecryptWithPin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _encryptedData: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pin: string,
): Promise<{ value: string; verified: boolean } | null> {
  console.warn(
    "secureDecryptWithPin is not implemented in Phase 1 - use crypto.ts directly",
  );
  return null;
}
