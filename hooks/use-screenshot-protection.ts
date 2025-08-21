/**
 * Screenshot Protection Hook (Legacy Compatibility)
 *
 * Provides secure screen capture protection for sensitive components in the cryptocurrency wallet.
 * This hook prevents screenshots and screen recordings when sensitive data like mnemonics,
 * private keys, PINs, and wallet balances are displayed.
 *
 * ⚠️ MIGRATION NOTICE:
 * This file provides backward compatibility for existing components. New components should use
 * the context-based protection from ScreenCaptureProtectionContext for better performance.
 *
 * Security Features:
 * - Prevents screenshots using native OS APIs via expo-screen-capture
 * - Supports conditional protection enabling/disabling
 * - Automatic cleanup when component unmounts
 * - Cross-platform support (iOS/Android)
 * - Development mode override for testing
 *
 * Usage:
 * - useScreenshotProtection() - Always protect (for critical data like mnemonics)
 * - useScreenshotProtection(condition) - Conditional protection based on state
 * - useScreenshotProtection(false) - Explicitly disable protection
 */

import {
  useCriticalDataProtection as useContextCriticalDataProtection,
  useFinancialDataProtection as useContextFinancialDataProtection,
  useAuthenticationProtection as useContextAuthenticationProtection,
} from "../context/ScreenCaptureProtectionContext";

/**
 * Configuration for screenshot protection behavior
 */

/**
 * Hook for critical sensitive data that should ALWAYS be protected
 * This is used for mnemonics, private keys, and other critical cryptographic material
 *
 * ⚠️ COMPATIBILITY: This now uses the context-based protection system
 */
export function useCriticalDataProtection(componentName?: string): void {
  useContextCriticalDataProtection(componentName || "Critical Data Component");
}

/**
 * Hook for protecting financial data (balances, transactions)
 * Can be configured by user preferences in the future
 *
 * ⚠️ COMPATIBILITY: This now uses the context-based protection system
 */
export function useFinancialDataProtection(
  shouldProtect: boolean = true,
  componentName?: string,
): void {
  useContextFinancialDataProtection(
    shouldProtect,
    componentName || "Financial Data Component",
  );
}

/**
 * Hook for protecting authentication flows (PIN entry, biometric)
 * Always protects in production, configurable in development
 *
 * ⚠️ COMPATIBILITY: This now uses the context-based protection system
 */
export function useAuthenticationProtection(componentName?: string): void {
  useContextAuthenticationProtection(
    componentName || "Authentication Component",
  );
}
