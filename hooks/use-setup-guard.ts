import { useState, useEffect, useCallback } from "react";
import { hasPINSetup, hasAccounts } from "../util/user-state";

export type SetupStatus = "loading" | "needs-pin" | "needs-account" | "complete";

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

/**
 * React hook that provides reactive setup status
 */
export function useSetupGuard() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>("loading");
  const [hasPin, setHasPin] = useState(false);
  const [hasUserAccounts, setHasUserAccounts] = useState(false);

  const checkStatus = useCallback(async () => {
    setSetupStatus("loading");
    try {
      const result = await checkSetupStatus();
      setHasPin(result.hasPin);
      setHasUserAccounts(result.hasUserAccounts);
      
      if (!result.hasPin) {
        setSetupStatus("needs-pin");
      } else if (!result.hasUserAccounts) {
        setSetupStatus("needs-account");
      } else {
        setSetupStatus("complete");
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      setSetupStatus("needs-pin"); // Fail safe
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    setupStatus,
    hasPin,
    hasUserAccounts,
    checkSetupStatus: checkStatus,
  };
}
