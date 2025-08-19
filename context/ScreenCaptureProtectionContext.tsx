/**
 * Screen Capture Protection Context
 *
 * Provides centralized screen capture protection management across the app.
 * This context-based approach offers several advantages:
 *
 * 1. Single source of truth for protection state
 * 2. Performance optimization - one native protection call instead of multiple
 * 3. Hierarchical protection levels with automatic escalation
 * 4. Future-proof for user preferences and dynamic protection rules
 *
 * Security Architecture:
 * - Context manages protection state at app level
 * - Components register their protection requirements
 * - Highest protection level automatically applied
 * - Native FLAG_SECURE and expo-screen-capture coordination
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePreventScreenCapture } from "expo-screen-capture";

import { secureLog } from "../util/secure-logging";

// Define __DEV__ since it's not exported by react-native
declare const __DEV__: boolean;

/**
 * Protection levels in ascending order of strictness
 */
export enum ProtectionLevel {
  NONE = 0,
  FINANCIAL = 1,
  AUTHENTICATION = 2,
  CRITICAL = 3,
}

/**
 * Component registration interface
 */
interface ProtectionRegistration {
  componentId: string;
  level: ProtectionLevel;
  enableInDev: boolean;
  reason: string;
}

/**
 * Context interface
 */
interface ScreenCaptureProtectionContextType {
  /** Current active protection level */
  activeProtectionLevel: ProtectionLevel;
  /** Whether protection is currently active */
  isProtectionActive: boolean;
  /** Register a component for protection */
  registerProtection: (registration: ProtectionRegistration) => void;
  /** Unregister a component */
  unregisterProtection: (componentId: string) => void;
  /** Get active registrations for debugging */
  getActiveRegistrations: () => ProtectionRegistration[];
}

/**
 * Context instance
 */
const ScreenCaptureProtectionContext =
  createContext<ScreenCaptureProtectionContextType | null>(null);

/**
 * Protection level descriptions for logging
 */
const PROTECTION_DESCRIPTIONS: Record<ProtectionLevel, string> = {
  [ProtectionLevel.NONE]: "No Protection",
  [ProtectionLevel.FINANCIAL]: "Financial Data Protection",
  [ProtectionLevel.AUTHENTICATION]: "Authentication Protection",
  [ProtectionLevel.CRITICAL]: "Critical Data Protection",
};

/**
 * Screen Capture Protection Provider
 *
 * Manages app-wide screen capture protection by coordinating multiple
 * component protection requirements and applying the highest level.
 */
export function ScreenCaptureProtectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Track all active protection registrations
  const [registrations, setRegistrations] = useState<
    Map<string, ProtectionRegistration>
  >(new Map());

  // Track current active protection level
  const [activeProtectionLevel, setActiveProtectionLevel] =
    useState<ProtectionLevel>(ProtectionLevel.NONE);

  // Ref to track if we've logged the current state to avoid spam
  const lastLoggedLevel = useRef<ProtectionLevel>(ProtectionLevel.NONE);

  // Calculate the highest protection level from all registrations
  const calculateProtectionLevel = useCallback(
    (regs: Map<string, ProtectionRegistration>): ProtectionLevel => {
      let maxLevel = ProtectionLevel.NONE;

      for (const registration of regs.values()) {
        // Skip dev-disabled registrations in development
        if (__DEV__ && !registration.enableInDev) {
          continue;
        }

        if (registration.level > maxLevel) {
          maxLevel = registration.level;
        }
      }

      return maxLevel;
    },
    [],
  );

  // Update active protection level when registrations change
  useEffect(() => {
    const newLevel = calculateProtectionLevel(registrations);

    if (newLevel !== activeProtectionLevel) {
      setActiveProtectionLevel(newLevel);

      // Log level changes for debugging (avoid spam)
      if (__DEV__ && newLevel !== lastLoggedLevel.current) {
        const activeComponents = Array.from(registrations.values())
          .filter((reg) => (__DEV__ ? reg.enableInDev : true))
          .map((reg) => reg.componentId);

        secureLog(
          `[Screen Protection] Level changed: ${PROTECTION_DESCRIPTIONS[lastLoggedLevel.current]} -> ${PROTECTION_DESCRIPTIONS[newLevel]}`,
          `\nActive components: [${activeComponents.join(", ")}]`,
          `\nTotal registrations: ${registrations.size}`,
        );

        lastLoggedLevel.current = newLevel;
      }
    }
  }, [registrations, activeProtectionLevel, calculateProtectionLevel]);

  // Register a component for protection
  const registerProtection = useCallback(
    (registration: ProtectionRegistration) => {
      setRegistrations((prev) => {
        const newMap = new Map(prev);
        newMap.set(registration.componentId, registration);
        return newMap;
      });
    },
    [],
  );

  // Unregister a component
  const unregisterProtection = useCallback((componentId: string) => {
    setRegistrations((prev) => {
      const newMap = new Map(prev);
      newMap.delete(componentId);
      return newMap;
    });
  }, []);

  // Get active registrations for debugging
  const getActiveRegistrations = useCallback((): ProtectionRegistration[] => {
    return Array.from(registrations.values());
  }, [registrations]);

  // Apply native screen capture protection based on active level
  // Use expo-screen-capture for JavaScript-level coordination with FLAG_SECURE
  const shouldProtect = activeProtectionLevel > ProtectionLevel.NONE;
  usePreventScreenCapture(
    shouldProtect ? "wallet-global-protection" : undefined,
  );

  const isProtectionActive = shouldProtect;

  const contextValue: ScreenCaptureProtectionContextType = {
    activeProtectionLevel,
    isProtectionActive,
    registerProtection,
    unregisterProtection,
    getActiveRegistrations,
  };

  return (
    <ScreenCaptureProtectionContext.Provider value={contextValue}>
      {children}
    </ScreenCaptureProtectionContext.Provider>
  );
}

/**
 * Hook to access screen capture protection context
 */
export function useScreenCaptureProtectionContext(): ScreenCaptureProtectionContextType {
  const context = useContext(ScreenCaptureProtectionContext);

  if (!context) {
    throw new Error(
      "useScreenCaptureProtectionContext must be used within a ScreenCaptureProtectionProvider",
    );
  }

  return context;
}

/**
 * Hook for components to register for screen capture protection
 * This replaces the individual useScreenshotProtection hooks
 */
export function useScreenCaptureProtection(
  componentId: string,
  level: ProtectionLevel,
  enableInDev: boolean = false,
  reason: string = "General protection",
) {
  const { registerProtection, unregisterProtection } =
    useScreenCaptureProtectionContext();

  useEffect(() => {
    const registration: ProtectionRegistration = {
      componentId,
      level,
      enableInDev,
      reason,
    };

    registerProtection(registration);

    // Cleanup on unmount
    return () => {
      unregisterProtection(componentId);
    };
  }, [
    componentId,
    level,
    enableInDev,
    reason,
    registerProtection,
    unregisterProtection,
  ]);
}

/**
 * Convenience hooks that wrap useScreenCaptureProtection with appropriate levels
 * These maintain backward compatibility with existing component hooks
 */

export function useCriticalDataProtection(componentName: string): void {
  useScreenCaptureProtection(
    componentName,
    ProtectionLevel.CRITICAL,
    true, // Always protect critical data, even in dev
    "Critical cryptographic data (mnemonics, private keys)",
  );
}

export function useFinancialDataProtection(
  shouldProtect: boolean = true,
  componentName: string,
): void {
  useScreenCaptureProtection(
    componentName,
    shouldProtect ? ProtectionLevel.FINANCIAL : ProtectionLevel.NONE,
    false, // Allow screenshots in dev for financial data
    "Financial data (balances, transactions)",
  );
}

export function useAuthenticationProtection(componentName: string): void {
  useScreenCaptureProtection(
    componentName,
    ProtectionLevel.AUTHENTICATION,
    true, // Protect auth flows in dev for security testing
    "Authentication data (PIN entry, biometric)",
  );
}
