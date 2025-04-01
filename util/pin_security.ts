/**
 * PIN Security Module
 *
 * This module implements secure PIN handling using industry best practices,
 * with cross-platform support via noble-hashes, a modern and audited cryptography library.
 *
 * 1. Uses PBKDF2 (Password-Based Key Derivation Function 2) - a key stretching algorithm
 *    designed to be computationally intensive, making brute force attacks difficult.
 *
 * 2. Implements unique random salts for each PIN - preventing rainbow table attacks and
 *    ensuring that identical PINs result in different hashes.
 *
 * 3. Uses 10,000 iterations - this increases the computational work required to crack
 *    the hash. This number can be increased for more security at the cost of performance.
 *
 * Security considerations:
 * - The salt MUST be stored alongside the hash for verification to work.
 * - This is significantly more secure than simple hashing but not invulnerable.
 * - For highest security, PIN verification should happen server-side in a secure environment.
 * - If implemented client-side, be aware that determined attackers could extract the PIN
 *   by modifying the application code.
 *
 * @module pin_security
 */
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// Fix for environments without crypto.getRandomValues
// This is needed to ensure cross-platform compatibility
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
  // Use Node.js crypto module if available
  try {
    const nodeCrypto = require('crypto');
    globalThis.crypto = {
      getRandomValues: function(buffer: Uint8Array): Uint8Array {
        return nodeCrypto.randomFillSync(buffer);
      }
    };
  } catch (e) {
    // Fallback for environments without Node.js crypto
    console.warn('WARNING: No secure random number generator available. Using Math.random which is NOT cryptographically secure!');
    globalThis.crypto = {
      getRandomValues: function(buffer: Uint8Array): Uint8Array {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      }
    };
  }
}

/**
 * Generate cryptographically secure random bytes
 */
function getSecureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Result of PIN hashing operation containing both hash and salt
 *
 * Both values must be stored securely to verify PINs later.
 * In a database, these should be stored in a user credentials table.
 */
export interface HashedPin {
  hash: string;
  salt: string;
}

/**
 * Securely hashes a PIN using PBKDF2 with a random salt.
 *
 * @param pin - The PIN string to hash (expected to be 6 digits)
 * @returns Object containing the hash and salt, both as hex strings
 *
 * @remarks
 * This function generates a different hash each time it's called, even for the same PIN,
 * because it uses a random salt. This is intentional and follows security best practices.
 *
 * For verification to work, you must store both the generated hash AND salt together.
 * The verifyPin function can then use the original salt to check if a provided PIN matches.
 */
export function hashPin(pin: string): HashedPin {
  // Generate a random salt (16 bytes) using our custom function
  const salt = bytesToHex(getSecureRandomBytes(16));

  // Use PBKDF2 with 10000 iterations and SHA-256
  const hash = bytesToHex(
    pbkdf2(
      sha256,
      new TextEncoder().encode(pin),
      hexToBytes(salt),
      { c: 10000, dkLen: 64 }
    )
  );

  return { hash, salt };
}

/**
 * Verifies if a provided PIN matches a stored hashed PIN.
 *
 * @param pin - The PIN to verify
 * @param storedHash - The previously stored hash
 * @param storedSalt - The salt used for the stored hash
 * @returns True if the PIN matches, false otherwise
 *
 * @remarks
 * This function is deterministic - given the same PIN and salt, it will always produce
 * the same hash. This allows for verification without storing the original PIN.
 *
 * Security properties:
 * - Note: CryptoJS doesn't have a timing-safe comparison,
 *   so we do a direct comparison (less ideal but necessary for cross-platform).
 *   In production, consider using a constant-time comparison polyfill.
 * - The original PIN is never stored anywhere
 * - Even if the hash and salt are compromised, deriving the original PIN
 *   requires significant computational resources
 */
export function verifyPin(pin: string, storedHash: string, storedSalt: string): boolean {
  const hash = bytesToHex(
    pbkdf2(
      sha256,
      new TextEncoder().encode(pin),
      hexToBytes(storedSalt),
      { c: 10000, dkLen: 64 }
    )
  );

  // Use a constant-time comparison to prevent timing attacks
  return timingSafeEqual(hash, storedHash);
}

/**
 * Performs a constant-time comparison of two strings to prevent timing attacks.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validates if a PIN meets the requirements.
 *
 * @param pin - The PIN string to validate
 * @returns True if the PIN is exactly 6 digits, false otherwise
 *
 * @remarks
 * Validation should always be performed before hashing a PIN.
 * While 6-digit PINs provide reasonable security for most applications,
 * they are vulnerable to brute force if an attacker has unlimited attempts.
 * Consider implementing attempt limiting or lockout mechanisms.
 */
export function validatePin(pin: string): boolean {
  // Check if PIN is exactly 6 digits
  return /^\d{6}$/.test(pin);
}
