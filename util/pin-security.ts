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
 * - We use secure random salt generation via expo-crypto (which uses OS-level randomness)
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
import * as crypto from "expo-crypto";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { constantTimeEqual } from "./security-utils";

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
    const saltBytes = crypto.getRandomBytes(16);
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
