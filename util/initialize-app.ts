import { appConfig, maybeInitializeDefaultProfile } from "./app-config-store";
import * as LocalAuthentication from "expo-local-authentication";

/**
 * Initializes the application by ensuring the configuration is properly loaded.
 * This function should be called once when the application starts.
 */
export async function initializeApp() {
  console.time('initialize-app-total');

  try {
    // Start with the most critical initialization - config loading
    console.time('config-load');
    // Check if we have any profiles after persistence has loaded
    const profiles = appConfig.profiles.get();
    const profileCount = Object.keys(profiles).length;
    console.timeEnd('config-load');

    // Only initialize a default profile if we truly have no profiles
    if (profileCount === 0) {
      console.time('default-profile-init');
      maybeInitializeDefaultProfile();
      console.timeEnd('default-profile-init');
    }

    // Verify active account validity
    console.time('verify-active-account');
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
    console.timeEnd('verify-active-account');

    // Biometric checks can be moved to authentication flow instead of initialization
    // This allows the UI to render faster while biometric setup happens in background
    setTimeout(() => {
      // Non-blocking biometric warmup
      LocalAuthentication.hasHardwareAsync().then(hasHardware => {
        console.log("Biometric hardware available:", hasHardware);
        if (hasHardware) {
          LocalAuthentication.isEnrolledAsync().then(isEnrolled => {
            console.log("Biometrics enrolled:", isEnrolled);
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
  } finally {
    console.timeEnd('initialize-app-total');
  }
}
