import { appConfig, maybeInitializeDefaultProfile } from "./app-config-store";
import { initializeRevealController } from "./reveal-controller";
import { initializeLibraClient } from "./libra-client";
import { resetAppToCleanState } from "./clear-storage-controller";
import { startBalancePolling } from "./balance-polling-service";
import { initializeErrorLogging } from "./error-utils";
import { SHOULD_RESET_APP_DATA } from "./environment";
import {
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from "expo-local-authentication";

// Session-level flag to track if reset has already been performed
let hasResetInThisSession = false;

// Removed unused exports: resetSessionFlag, hasPerformedResetInSession

/**
 * Initializes the application by ensuring the configuration is properly loaded.
 * This function should be called once when the application starts.
 */
export async function initializeApp() {
  try {
    // Initialize error logging system first
    initializeErrorLogging();

    // Check if we should reset app data based on environment variable
    // Only reset once per session to avoid infinite loops
    if (SHOULD_RESET_APP_DATA && !hasResetInThisSession) {
      console.log(
        "EXPO_PUBLIC_RESET_APP_DATA is set - resetting app to clean state (once per session)",
      );
      await resetAppToCleanState();
      hasResetInThisSession = true;
      console.log("App reset completed - continuing with initialization");
    } else if (SHOULD_RESET_APP_DATA && hasResetInThisSession) {
      console.log(
        "Reset already performed in this session - skipping duplicate reset",
      );
    }

    // Check if biometric authentication is available
    const hasHardware = await hasHardwareAsync();
    console.log("Biometric hardware available:", hasHardware);

    // Prepare local authentication if available
    if (hasHardware) {
      const isEnrolled = await isEnrolledAsync();
      console.log("Biometrics enrolled:", isEnrolled);

      if (isEnrolled) {
        // Pre-warm the biometric subsystem
        supportedAuthenticationTypesAsync();
      }
    }

    // Wait for persistence to load (allow some time for hydration)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if we have any profiles after persistence has loaded
    const profiles = appConfig.profiles.get();
    const profileCount = Object.keys(profiles).length;

    // Only initialize a default profile if we truly have no profiles
    if (profileCount === 0) {
      // Log the state before initialization
      console.log("Before initialization:", JSON.stringify(appConfig.get()));

      maybeInitializeDefaultProfile();

      // Log the state after initialization
      console.log("After initialization:", JSON.stringify(appConfig.get()));
    }

    // Verify active account validity
    const activeAccountId = appConfig.activeAccountId.get();
    if (activeAccountId !== null) {
      // Check if this account actually exists in any profile
      let accountExists = false;

      for (const profileName in profiles) {
        const profile = profiles[profileName];
        if (profile.accounts.some((acc) => acc.id === activeAccountId)) {
          accountExists = true;
          break;
        }
      }

      if (!accountExists) {
        console.log("Active account doesn't exist, resetting");
        appConfig.activeAccountId.set(null);
      }
    }

    // Initialize reveal controller and cleanup expired schedules
    initializeRevealController();

    // Initialize global LibraClient instance
    try {
      initializeLibraClient();
      console.log("Global LibraClient initialized successfully");
    } catch (error) {
      console.error("Failed to initialize LibraClient:", error);
      // Don't fail app initialization if LibraClient fails
      // It can be initialized later when needed
    }

    // Start the background balance polling service
    try {
      startBalancePolling();
      console.log("Balance polling service started successfully");
    } catch (error) {
      console.error("Failed to start balance polling service:", error);
      // Don't fail app initialization if balance polling fails
    }

    return true;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    return false;
  }
}
