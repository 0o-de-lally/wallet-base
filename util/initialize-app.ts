import * as LocalAuthentication from "expo-local-authentication";
import { appConfig } from "./app-config-store";
import { maybeInitializeDefaultProfile } from "./app-config-store";

/**
 * Initializes the application by ensuring the configuration is properly loaded.
 * This function should be called once when the application starts.
 */
export async function initializeApp() {
  try {
    // Check if we have any profiles after persistence has loaded
    const profiles = appConfig.profiles.get();
    const profileCount = Object.keys(profiles).length;

    // Only initialize a default profile if we truly have no profiles
    if (profileCount === 0) {
      maybeInitializeDefaultProfile();
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

    // Biometric checks can be moved to authentication flow instead of initialization
    // This allows the UI to render faster while biometric setup happens in background
    setTimeout(() => {
      // Non-blocking biometric warmup
      LocalAuthentication.hasHardwareAsync().then((hasHardware) => {
        if (hasHardware) {
          LocalAuthentication.isEnrolledAsync().then((isEnrolled) => {
            if (isEnrolled) {
              // Pre-warm the biometric subsystem
              LocalAuthentication.supportedAuthenticationTypesAsync();
            }
          });
        }
      });
    }, 0);

    return true;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    return false;
  }
}
