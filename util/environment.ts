/**
 * Environment Detection Utilities
 *
 * Provides build-time constants for environment detection that can be used
 * across the application to enable environment-specific behavior.
 */

/**
 * Build-time constant that determines if the app is running in production.
 * This is determined at build time using environment flags:
 * - __DEV__ flag (React Native development mode)
 * - process.env.NODE_ENV (Node.js environment)
 *
 * Returns true for production builds, false for development/preview builds.
 */
export const IS_PRODUCTION = !__DEV__ && process.env.NODE_ENV === "production";

/**
 * Build-time constant that determines if the app is running in development.
 * Inverse of IS_PRODUCTION for convenience.
 */
export const IS_DEVELOPMENT = !IS_PRODUCTION;

/**
 * Build-time constant that determines if debugging features should be enabled.
 * This includes the __DEV__ flag check for React Native development mode.
 * Removed unused constant: IS_DEBUG
 */

/**
 * Environment flag to trigger complete app data reset on startup.
 * When set to "true", the app will wipe all stored data and act like a clean installation.
 * This is useful for development and testing purposes.
 */
export const SHOULD_RESET_APP_DATA =
  process.env.EXPO_PUBLIC_RESET_APP_DATA === "true";
