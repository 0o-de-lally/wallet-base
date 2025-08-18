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

import { useEffect } from "react";
import { usePreventScreenCapture } from "expo-screen-capture";
import { 
  useCriticalDataProtection as useContextCriticalDataProtection,
  useFinancialDataProtection as useContextFinancialDataProtection,
  useAuthenticationProtection as useContextAuthenticationProtection
} from "../context/ScreenCaptureProtectionContext";

// Define __DEV__ since it's not exported by react-native
declare const __DEV__: boolean;

/**
 * Configuration for screenshot protection behavior
 */
interface ScreenshotProtectionConfig {
  /** Whether to enable protection in development mode (default: false for easier debugging) */
  enableInDev?: boolean;
  /** Custom identifier for logging purposes */
  componentName?: string;
  /** Whether to show console logs for protection state changes */
  verbose?: boolean;
}

/**
 * Hook for protecting screens from screenshot capture
 * 
 * @param shouldProtect Whether to enable screenshot protection (default: true)
 * @param config Optional configuration for protection behavior
 */
export function useScreenshotProtection(
  shouldProtect: boolean = true,
  config: ScreenshotProtectionConfig = {}
): void {
  const {
    enableInDev = false,
    componentName = "Unknown Component",
    verbose = __DEV__,
  } = config;

  // In development, only protect if explicitly enabled
  const isProtectionEnabled = shouldProtect && (enableInDev || !__DEV__);

  // Use expo-screen-capture hook for native protection
  // Pass key when enabled, undefined when disabled
  usePreventScreenCapture(isProtectionEnabled ? "wallet-protection" : undefined);

  // Log protection state changes for debugging
  useEffect(() => {
    if (verbose) {
      const state = isProtectionEnabled ? "ENABLED" : "DISABLED";
      const reason = !shouldProtect 
        ? "(explicitly disabled)"
        : __DEV__ && !enableInDev 
        ? "(dev mode, set enableInDev: true to test)"
        : "";
      
      console.log(`[Screenshot Protection] ${state} for ${componentName} ${reason}`);
    }
  }, [isProtectionEnabled, componentName, verbose, shouldProtect, enableInDev]);
}

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
  componentName?: string
): void {
  useContextFinancialDataProtection(shouldProtect, componentName || "Financial Data Component");
}

/**
 * Hook for protecting authentication flows (PIN entry, biometric)
 * Always protects in production, configurable in development
 * 
 * ⚠️ COMPATIBILITY: This now uses the context-based protection system
 */
export function useAuthenticationProtection(componentName?: string): void {
  useContextAuthenticationProtection(componentName || "Authentication Component");
}