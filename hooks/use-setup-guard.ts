import { hasPINSetup, hasAccounts } from "../util/user-state";

// Removed unused export: SetupStatus type (duplicate of the one in util/setup-state.ts)

/**
 * Simple hook that checks current setup status
 */
export async function checkSetupStatus() {
  const hasPin = await hasPINSetup();
  const hasUserAccounts = hasAccounts();

  return {
    hasPin,
    hasUserAccounts,
    isComplete: hasPin && hasUserAccounts,
  };
}

// Removed unused function: useSetupGuard - it was not being imported or used anywhere
