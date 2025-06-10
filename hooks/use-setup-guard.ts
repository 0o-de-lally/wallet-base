import { useEffect } from "react";
import { setupState, updateSetupStatus, refreshSetupStatus, SetupStatus } from "../util/setup-state";
import { appConfig } from "../util/app-config-store";

interface SetupGuardResult {
  setupStatus: SetupStatus;
  hasPin: boolean;
  hasUserAccounts: boolean;
  checkSetupStatus: () => Promise<void>;
}

/**
 * Hook that provides reactive access to the user's setup status.
 * This hook automatically updates when setup state changes.
 */
export function useSetupGuard(): SetupGuardResult {
  // Get reactive values from setup state - use .get() since we'll wrap component with observer
  const setupStatus = setupState.status.get();
  const hasPin = setupState.hasPin.get();
  const hasUserAccounts = setupState.hasUserAccounts.get();

  // Initial setup status check only
  useEffect(() => {
    console.log("Setup guard: Initial setup status check");
    updateSetupStatus();
  }, []);

  return {
    setupStatus,
    hasPin,
    hasUserAccounts,
    checkSetupStatus: updateSetupStatus,
  };
}
