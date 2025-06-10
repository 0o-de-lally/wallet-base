import { observable } from "@legendapp/state";
import { hasCompletedBasicSetup, hasAccounts } from "./user-state";
import { appConfig, maybeInitializeDefaultProfile } from "./app-config-store";

export type SetupStatus = "loading" | "needs-pin" | "needs-account" | "complete";

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
export const setupState = observable<SetupState>({
  status: "loading",
  hasPin: false,
  hasUserAccounts: false,
  lastChecked: 0,
});

/**
 * Updates the setup status by checking current state
 */
export async function updateSetupStatus(): Promise<void> {
  try {
    console.log("Updating setup status...");
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
          console.log("No profiles found during setup status check, initializing default profile");
          maybeInitializeDefaultProfile();
        } else {
          console.log("Found existing profiles during setup status check:", Object.keys(profiles));
        }
      } else {
        console.log("AppConfig not yet available during setup status check");
        // If appConfig is not available, assume we need to set up everything
        setupState.status.set("needs-pin");
        setupState.hasPin.set(false);
        setupState.hasUserAccounts.set(false);
        setupState.lastChecked.set(Date.now());
        return;
      }
    } catch (initError) {
      console.log("Error during profile initialization check:", initError);
      // Continue with status check even if profile initialization fails
    }

    const pinExists = await hasCompletedBasicSetup();
    const accountsExist = hasAccounts();

    setupState.hasPin.set(pinExists);
    setupState.hasUserAccounts.set(accountsExist);
    setupState.lastChecked.set(Date.now());

    console.log("Setup status updated:", { pinExists, accountsExist });

    if (!pinExists) {
      setupState.status.set("needs-pin");
    } else if (!accountsExist) {
      setupState.status.set("needs-account");
    } else {
      setupState.status.set("complete");
    }
  } catch (error) {
    console.error("Error updating setup status:", error);
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
  console.log("Forcing setup status refresh");
  updateSetupStatus();
}
