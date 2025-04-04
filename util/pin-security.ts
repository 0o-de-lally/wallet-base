/**
 * PIN Security Module
 *
 * This module implements secure PIN handling using industry best practices,
 * with cross-platform support via crypto libraries that leverage native
 * implementations where available rather than less secure JS implementations.
 *
 * Security considerations:
 * - The original PIN is never stored anywhere.
 * - We minimize time spent keeping sensitive data in memory and avoid string
 *   interning by working with byte arrays where possible.
 * - Constant-time comparison functions are used to prevent timing attacks when
 *   verifying PINs.
 * - For highest security, PIN verification should happen server-side in a secure environment.
 * - If implemented client-side, be aware that determined attackers could extract the PIN
 *   by modifying the application code.
 * - PBKDF2 is used for PIN hashing, providing better protection against brute force attacks
 *   than simple hashing algorithms.
 *
 * @module pin_security
 */
import * as crypto from "expo-crypto";
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { constantTimeEqual } from './security-utils';

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
      dkLen: 32 // 32 bytes = 256 bits
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
    const derivedKey = pbkdf2(sha256, pinBytes, hexToBytes(storedHashedPin.salt), {
      c: storedHashedPin.iterations,
      dkLen: 32 // 32 bytes = 256 bits
    });

    const hash = bytesToHex(derivedKey);

    // Use our constant-time comparison utility
    return constantTimeEqual(hash, storedHashedPin.hash);
  } catch (error) {
    console.error("Error comparing PINs:", error);
    return false;
  }
}
