import {
  appConfig,
  maybeInitializeDefaultProfile,
  fixAccountAddresses,
} from "./app-config-store";
import { initializeRevealController } from "./reveal-controller";
import {
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from "expo-local-authentication";

/**
 * Initializes the application by ensuring the configuration is properly loaded.
 * This function should be called once when the application starts.
 */
export async function initializeApp() {
  try {
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

    // Fix AccountAddress objects that may have been deserialized as strings
    fixAccountAddresses();

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

    return true;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    return false;
  }
}
