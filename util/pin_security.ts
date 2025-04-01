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
 * Hashes a PIN with SHA-256 using salt and multiple iterations for security.
 * @param pin The PIN to hash
 * @param iterations Number of hash iterations for key stretching (default: 1000)
 * @returns The hashed PIN with salt and iteration info
 */
export async function hashPin(pin: string, iterations = 1000): Promise<HashedPin> {
  try {
    // Generate a random salt (16 bytes converted to hex = 32 characters)
    const saltBytes = crypto.getRandomBytes(16);
    const salt = Array.from(saltBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    // Initial hash with salt
    let hash = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      salt + pin
    );

    // Key stretching - multiple iterations of hashing
    for (let i = 1; i < iterations; i++) {
      hash = await crypto.digestStringAsync(
        crypto.CryptoDigestAlgorithm.SHA256,
        hash
      );
    }

    return {
      salt,
      hash,
      iterations
    };
  } catch (error) {
    console.error('Error hashing PIN:', error);
    throw new Error('Failed to hash PIN');
  }
}

/**
 * Securely compares two hashed PINs.
 * @param storedHashedPin Stored hashed PIN
 * @param inputPin Raw PIN input to verify
 * @returns Promise resolving to true if the PINs match, false otherwise
 */
export async function comparePins(storedHashedPin: HashedPin, inputPin: string): Promise<boolean> {
  try {
    // Hash the input PIN with the same salt and iterations
    let hash = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      storedHashedPin.salt + inputPin
    );

    // Apply the same number of iterations
    for (let i = 1; i < storedHashedPin.iterations; i++) {
      hash = await crypto.digestStringAsync(
        crypto.CryptoDigestAlgorithm.SHA256,
        hash
      );
    }

    // Compare the resulting hash with the stored hash
    return hash === storedHashedPin.hash;
  } catch (error) {
    console.error('Error comparing PINs:', error);
    return false;
  }
}
