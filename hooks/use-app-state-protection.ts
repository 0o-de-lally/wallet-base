/**
 * App State Protection Hook
 *
 * Provides privacy protection when the app goes to background by:
 * - Detecting app state changes (active/background/inactive)
 * - Showing a blur overlay to hide sensitive content in app switcher
 * - Optionally hiding specific sensitive content when backgrounded
 *
 * This prevents sensitive data from being visible in:
 * - iOS app switcher preview
 * - Android recent apps preview
 * - Screenshot-based attacks during app transitions
 *
 * Security Implementation:
 * - Uses React Native AppState API for reliable state detection
 * - Automatic blur overlay using expo-blur
 * - Immediate activation on state change for zero exposure window
 * - Cleanup on component unmount
 */

import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { devLog } from "../util/error-utils";

// Define __DEV__ since it's not exported by react-native
declare const __DEV__: boolean;

/**
 * App state protection configuration
 */
interface AppStateProtectionConfig {
  /** Whether to enable protection in development mode */
  enableInDev?: boolean;
  /** Custom component identifier for logging */
  componentName?: string;
  /** Whether to show verbose logging */
  verbose?: boolean;
  /** Blur intensity (0-100) */
  blurIntensity?: number;
  /** Blur tint style */
  blurTint?: "light" | "dark" | "default";
}

/**
 * Hook for protecting app content when backgrounded
 * Returns state information and blur configuration for components
 */
function useAppStateProtection(config: AppStateProtectionConfig = {}) {
  const {
    enableInDev = false,
    componentName = "App",
    verbose = __DEV__,
    blurIntensity = 100,
    blurTint = "dark",
  } = config;

  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );

  // Determine if privacy overlay should be shown
  const shouldShowPrivacyOverlay =
    appState !== "active" && (enableInDev || !__DEV__);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (verbose) {
        devLog(
          `[App State Protection] ${componentName}: ${appState} -> ${nextAppState}`,
        );
      }

      setAppState(nextAppState);
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.remove();
    };
  }, [appState, componentName, verbose]);

  return {
    /** Current app state */
    appState,
    /** Whether the app is currently active */
    isActive: appState === "active",
    /** Whether the app is in background */
    isBackground: appState === "background",
    /** Whether the app is inactive (transitioning) */
    isInactive: appState === "inactive",
    /** Whether to show privacy overlay */
    shouldShowPrivacyOverlay,
    /** Blur configuration object */
    blurConfig: {
      intensity: blurIntensity,
      tint: blurTint,
    },
  };
}

/**
 * Hook specifically for sensitive screens that need immediate privacy protection
 * More aggressive protection settings for screens with critical data
 */
export function useSensitiveScreenProtection(componentName?: string) {
  return useAppStateProtection({
    enableInDev: true, // Always protect sensitive screens, even in dev
    componentName: componentName || "Sensitive Screen",
    verbose: true,
    blurIntensity: 100, // Maximum blur
    blurTint: "dark",
  });
}
