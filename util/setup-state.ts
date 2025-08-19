import { observable } from "@legendapp/state";
import { hasPasswordSetup, hasAccounts } from "./user-state";
import { appConfig, maybeInitializeDefaultProfile } from "./app-config-store";
import { devLog, devError } from "./error-utils";

type SetupStatus = "loading" | "needs-pin" | "needs-account" | "complete";

interface SetupState {
  status: SetupStatus;
  hasPin: boolean;
  hasUserAccounts: boolean;
  lastChecked: number;
}

/**
 * Reactive setup state manager
 * This provides a centralized, observable state for user setup status
 */
const setupState = observable<SetupState>({
  status: "loading",
  hasPin: false,
  hasUserAccounts: false,
  lastChecked: 0,
});

/**
 * Updates the setup status by checking current state
 */
async function updateSetupStatus(): Promise<void> {
  try {
    devLog("Updating setup status...");
    setupState.status.set("loading");

    // Wait a short time for persistence to hydrate if needed
    // This ensures appConfig is properly loaded from storage
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Ensure we have a default profile if no profiles exist
    // This handles the case where the user is going through onboarding for the first time
    try {
      // More robust check for appConfig existence and initialization
      if (appConfig) {
        // Give appConfig.profiles a chance to be defined
        const profiles = appConfig.profiles?.get();
        if (!profiles || Object.keys(profiles).length === 0) {
          devLog(
            "No profiles found during setup status check, initializing default profile"
          );
          maybeInitializeDefaultProfile();
        } else {
          devLog(
            "Found existing profiles during setup status check:",
            Object.keys(profiles)
          );
        }
      } else {
        devLog("AppConfig not yet available during setup status check");
        // If appConfig is not available, assume we need to set up everything
        setupState.status.set("needs-pin");
        setupState.hasPin.set(false);
        setupState.hasUserAccounts.set(false);
        setupState.lastChecked.set(Date.now());
        return;
      }
    } catch (initError) {
      devError("setup-state", initError, "Error during profile initialization check");
      // Continue with status check even if profile initialization fails
    }

    const pinExists = await hasPasswordSetup();
    const accountsExist = hasAccounts();

    setupState.hasPin.set(pinExists);
    setupState.hasUserAccounts.set(accountsExist);
    setupState.lastChecked.set(Date.now());

    devLog("Setup status updated:", { pinExists, accountsExist });

    if (!pinExists) {
      setupState.status.set("needs-pin");
    } else if (!accountsExist) {
      setupState.status.set("needs-account");
    } else {
      setupState.status.set("complete");
    }
  } catch (error) {
    devError("setup-state", error, "Error updating setup status");
    // On error, assume user needs PIN for safety
    setupState.status.set("needs-pin");
    setupState.hasPin.set(false);
    setupState.hasUserAccounts.set(false);
    setupState.lastChecked.set(Date.now());
  }
}

/**
 * Force a setup status refresh
 * Call this when you know setup state has changed (e.g., after PIN creation, account creation, etc.)
 */
export function refreshSetupStatus(): void {
  devLog("Forcing setup status refresh");

  // Immediate update
  updateSetupStatus();

  // Also schedule a delayed update to catch any state propagation delays
  setTimeout(() => {
    devLog("Delayed setup status refresh");
    updateSetupStatus();
  }, 100);
}
