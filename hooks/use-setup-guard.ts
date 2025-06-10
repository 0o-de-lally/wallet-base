import { hasPINSetup, hasAccounts } from "../util/user-state";

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
