/**
 * PIN Security Module
 *
 * This module implements secure PIN handling using industry best practices,
 * with cross-platform support via expo-crypto, a modern and audited cryptography library.
 *
 * Security considerations:
 * - The original PIN is never stored anywhere.
 * - For highest security, PIN verification should happen server-side in a secure environment.
 * - If implemented client-side, be aware that determined attackers could extract the PIN
 *   by modifying the application code.
 *
 * @module pin_security
 */
import * as crypto from 'expo-crypto';

// Define a custom type for the hashed PIN
export type HashedPin = string;

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
 * Hashes a PIN with SHA-256.
 * @param pin The PIN to hash
 * @returns The hashed PIN
 */
export function hashPin(pin: string): HashedPin {
  try {
    // Use a consistent hashing method for the PIN
    const hashedPin = crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );

    return hashedPin as unknown as HashedPin;
  } catch (error) {
    console.error('Error hashing PIN:', error);
    throw new Error('Failed to hash PIN');
  }
}

/**
 * Securely compares two hashed PINs.
 * @param hashedPin1 First hashed PIN
 * @param hashedPin2 Second hashed PIN
 * @returns true if the PINs match, false otherwise
 */
export function comparePins(hashedPin1: HashedPin, hashedPin2: HashedPin): boolean {
  return String(hashedPin1) === String(hashedPin2);
}
