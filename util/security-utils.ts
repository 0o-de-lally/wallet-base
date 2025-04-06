/**
 * Security Utilities
 *
 * This module provides security-related utility functions that can be used
 * across the application.
 */

/**
 * Performs a constant-time comparison of two strings.
 * This helps prevent timing attacks when comparing sensitive data like hashes.
 *
 * @param a First string to compare
 * @param b Second string to compare
 * @returns true if the strings are identical, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
  // If lengths differ, return false but continue comparison to prevent timing attacks
  const result = a.length === b.length ? 0 : 1;

  // Use the smaller length to avoid out-of-bounds access
  const len = Math.min(a.length, b.length);

  let diff = result;
  for (let i = 0; i < len; i++) {
    // XOR characters (will be 0 if same, non-zero if different)
    // OR with running diff so any difference is preserved
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  // If strings are equal and same length, diff will be 0
  return diff === 0;
}

/**
 * Performs a constant-time comparison of two Uint8Arrays.
 * This helps prevent timing attacks when comparing sensitive data like cryptographic keys.
 *
 * @param a First Uint8Array to compare
 * @param b Second Uint8Array to compare
 * @returns true if the arrays are identical, false otherwise
 */
export function constantTimeEqualUint8Array(
  a: Uint8Array,
  b: Uint8Array,
): boolean {
  // If lengths differ, return false but continue comparison to prevent timing attacks
  const result = a.length === b.length ? 0 : 1;

  // Use the smaller length to avoid out-of-bounds access
  const len = Math.min(a.length, b.length);

  let diff = result;
  for (let i = 0; i < len; i++) {
    // XOR bytes (will be 0 if same, non-zero if different)
    // OR with running diff so any difference is preserved
    diff |= a[i] ^ b[i];
  }

  // If arrays are equal and same length, diff will be 0
  return diff === 0;
}
