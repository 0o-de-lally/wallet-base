/**
 * Global constants for the wallet application
 */

/**
 * Scale factor for Libra token amounts
 * API returns unscaled values that need to be divided by this factor
 * to get the actual decimal value (e.g., 1,000,000 -> 1.0)
 */
export const LIBRA_SCALE_FACTOR = 1_000_000;

/**
 * Balance polling configuration
 */
export const BALANCE_POLLING = {
  INTERVAL_MS: 30_000, // 30 seconds
  MAX_ERROR_COUNT: 5,
} as const;

/**
 * Network timeout and retry configuration
 */
export const NETWORK = {
  DEFAULT_TIMEOUT_MS: 10_000, // 10 seconds
  MAX_RETRY_ATTEMPTS: 3,
} as const;

/**
 * UI formatting constants
 */
export const FORMATTING = {
  ADDRESS_PREFIX_LENGTH: 4,
  ADDRESS_SUFFIX_LENGTH: 4,
  DECIMAL_PLACES: {
    SMALL_AMOUNT: 6, // For amounts < 1
    MEDIUM_AMOUNT: 4, // For amounts < 100
    LARGE_AMOUNT: 2, // For amounts >= 100
  },
} as const;
