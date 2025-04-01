/**
 * Hashes a PIN with a predefined salt using a simple algorithm.
 *
 * @param pin - The PIN string to hash (expected to be 6 digits)
 * @returns A hexadecimal string representation of the hashed PIN
 * @remarks In a production app, use a more robust crypto library
 */
export function hashPin(pin: string): string {
  // Salt is hardcoded as per requirements
  const salt = "OL_SALT";

  // Combine PIN with salt
  const valueToHash = pin + salt;

  // Simple string hashing function
  let hash = 0;
  for (let i = 0; i < valueToHash.length; i++) {
    const char = valueToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to string and ensure it's positive
  return Math.abs(hash).toString(16);
}

/**
 * Validates if a PIN meets the requirements.
 *
 * @param pin - The PIN string to validate
 * @returns True if the PIN is exactly 6 digits, false otherwise
 */
export function validatePin(pin: string): boolean {
  // Check if PIN is exactly 6 digits
  return /^\d{6}$/.test(pin);
}
