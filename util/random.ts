/**
 * Polyfill for crypto.getRandomValues in React Native
 * Secure random number generation utilities
 * Uses react-native-get-random-values for native OS crypto implementation
 */
import "react-native-get-random-values";

/**
 * Generates cryptographically secure random bytes using the native OS implementation
 * @param size Number of bytes to generate
 * @returns Uint8Array with random bytes
 */
export function getRandomBytes(size: number): Uint8Array {
  const buffer = new Uint8Array(size);
  crypto.getRandomValues(buffer);
  return buffer;
}

/**
 * Generates a random hex string
 * @param size Number of bytes to generate (hex string will be 2x this length)
 * @returns Hex string
 */
export function getRandomHex(size: number): string {
  const bytes = getRandomBytes(size);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
