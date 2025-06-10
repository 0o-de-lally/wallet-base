import { useState, useEffect, useCallback } from "react";
import { hasCompletedBasicSetup, hasAccounts } from "../util/user-state";

export type SetupStatus = "loading" | "needs-pin" | "needs-account" | "complete";

interface SetupGuardResult {
  setupStatus: SetupStatus;
  hasPin: boolean;
  hasUserAccounts: boolean;
  checkSetupStatus: () => Promise<void>;
}

/**
 * Hook that checks if the user has completed the necessary setup steps
 * and provides the current setup status for routing decisions.
 */
export function useSetupGuard(): SetupGuardResult {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>("loading");
  const [hasPin, setHasPin] = useState(false);
  const [hasUserAccounts, setHasUserAccounts] = useState(false);

  const checkSetupStatus = useCallback(async () => {
    try {
      setSetupStatus("loading");

      const pinExists = await hasCompletedBasicSetup();
      const accountsExist = hasAccounts();

      setHasPin(pinExists);
      setHasUserAccounts(accountsExist);

      console.log("Setup guard check:", { pinExists, accountsExist });

      if (!pinExists) {
        setSetupStatus("needs-pin");
      } else if (!accountsExist) {
        setSetupStatus("needs-account");
      } else {
        setSetupStatus("complete");
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      // On error, assume user needs PIN for safety
      setSetupStatus("needs-pin");
      setHasPin(false);
      setHasUserAccounts(false);
    }
  }, []);

  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  return {
    setupStatus,
    hasPin,
    hasUserAccounts,
    checkSetupStatus,
  };
}
