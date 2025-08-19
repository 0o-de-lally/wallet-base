import {
  appConfig,
  getProfileForAccount,
  type AccountState,
} from "./app-config-store";
import { getLibraClient } from "./libra-client";
import { fetchAndUpdateProfilePollingData } from "./account-polling";
import { clearAccountErrors } from "./account-balance";
import { BALANCE_POLLING } from "./constants";
import { reportErrorAuto, devLog, devError } from "./error-utils";

class BalancePollingService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly POLL_INTERVAL = BALANCE_POLLING.INTERVAL_MS;
  private readonly MAX_ERROR_COUNT = BALANCE_POLLING.MAX_ERROR_COUNT;

  /**
   * Checks if an account should be skipped due to consecutive errors
   */
  private shouldSkipAccount(account: AccountState): boolean {
    if (!account.error_count || account.error_count <= this.MAX_ERROR_COUNT) {
      return false;
    }

    // Implement exponential backoff - skip more frequently as error count increases
    const backoffFactor = Math.min(
      Math.pow(2, account.error_count - this.MAX_ERROR_COUNT),
      64,
    );
    const shouldSkip = Math.random() < (backoffFactor - 1) / backoffFactor;

    if (shouldSkip) {
      devLog(
        `Skipping balance fetch for account ${account.id} (${account.error_count} consecutive errors)`,
      );
    }

    return shouldSkip;
  }

  /**
   * Starts the balance polling service
   */
  start(): void {
    if (this.isRunning) {
      devLog("Balance polling service is already running");
      return;
    }

    devLog("Starting account polling service (every 30 seconds)");
    this.isRunning = true;

    // Run immediately on start
    this.pollBalances();

    // Set up recurring polling
    this.intervalId = setInterval(() => {
      this.pollBalances();
    }, this.POLL_INTERVAL);
  }

  /**
   * Stops the balance polling service
   */
  stop(): void {
    if (!this.isRunning) {
      devLog("Balance polling service is not running");
      return;
    }

    devLog("Stopping balance polling service");
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Checks if the service is currently running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Polls account data (balances, v8 authorization, etc.) for the active profile
   */
  private async pollBalances(): Promise<void> {
    try {
      const client = getLibraClient();
      if (!client) {
        devLog("No Libra client available, skipping balance poll");
        return;
      }

      // Get the active account and its profile
      const activeAccountId = appConfig.activeAccountId.get();
      if (!activeAccountId) {
        devLog("No active account, skipping balance poll");
        return;
      }

      const activeProfileName = getProfileForAccount(activeAccountId);
      if (!activeProfileName) {
        devLog("No active profile found, skipping balance poll");
        return;
      }

      // Get the active profile's accounts
      const profiles = appConfig.profiles.get();
      const activeProfile = profiles[activeProfileName];

      if (
        !activeProfile ||
        !activeProfile.accounts ||
        activeProfile.accounts.length === 0
      ) {
        devLog("No accounts in active profile, skipping balance poll");
        return;
      }

      devLog(
        `Polling account data for ${activeProfile.accounts.length} accounts in profile: ${activeProfileName}`,
      );

      // Fetch and update polling data for all accounts in the active profile
      await fetchAndUpdateProfilePollingData(
        client,
        activeProfileName,
        activeProfile.accounts,
        (account: AccountState) => this.shouldSkipAccount(account),
      );

      devLog("Account polling completed successfully");
    } catch (error) {
      // Use the error reporting system
      reportErrorAuto("balancePolling", error);

      // Don't stop the service on error, just log and continue
    }
  }

  /**
   * Manually trigger an account data poll (useful for immediate refresh)
   */
  async triggerPoll(): Promise<void> {
    devLog("Manually triggering account data poll");
    await this.pollBalances();
  }

  /**
   * Reset the polling interval (useful when changing settings)
   */
  restart(): void {
    this.stop();
    this.start();
  }

  /**
   * Manually retry account data fetch for a specific account (clears error state)
   */
  async retryAccount(accountId: string): Promise<void> {
    try {
      const profiles = appConfig.profiles.get();
      let targetAccount = null;
      let targetProfileName = null;

      // Find the account
      for (const [profileName, profile] of Object.entries(profiles)) {
        const account = profile.accounts.find((acc) => acc.id === accountId);
        if (account) {
          targetAccount = account;
          targetProfileName = profileName;
          break;
        }
      }

      if (!targetAccount || !targetProfileName) {
        reportErrorAuto(
          "retryAccount",
          new Error(`Account ${accountId} not found for retry`),
        );
        return;
      }

      devLog(
        `Retrying account data fetch for account ${targetAccount.nickname} (${accountId})`,
      );

      // Clear error state
      await clearAccountErrors(accountId);

      // Fetch polling data
      const client = getLibraClient();
      if (client) {
        const { fetchAndUpdateAccountPollingData } = await import(
          "./account-polling"
        );
        await fetchAndUpdateAccountPollingData(client, targetAccount);
      }
    } catch (error) {
      reportErrorAuto("retryAccount", error, { accountId });
    }
  }

  /**
   * Immediately refresh account data for a newly added account
   * This is used to avoid waiting for the regular polling cycle
   */
  async refreshNewAccount(accountId: string): Promise<void> {
    try {
      devLog(`refreshNewAccount called for accountId: ${accountId}`);

      const profiles = appConfig.profiles.get();
      let targetAccount = null;

      // Find the account
      for (const profile of Object.values(profiles)) {
        const account = profile.accounts.find((acc) => acc.id === accountId);
        if (account) {
          targetAccount = account;
          break;
        }
      }

      if (!targetAccount) {
        devError("balance-polling", new Error(`Account ${accountId} not found for immediate refresh`), "Account not found for immediate refresh");
        return;
      }

      devLog(
        `Immediately refreshing account data for newly added account: ${targetAccount.nickname || targetAccount.id}`,
      );

      const client = getLibraClient();
      if (client) {
        const { fetchAndUpdateAccountPollingData } = await import(
          "./account-polling"
        );
        await fetchAndUpdateAccountPollingData(client, targetAccount);
        devLog(
          `Account data refresh completed for ${targetAccount.nickname || targetAccount.id}`,
        );
      } else {
        devError("balance-polling", new Error("No Libra client available for immediate account refresh"), "No Libra client available for immediate account refresh");
      }
    } catch (error) {
      devError("balance-polling", error, "Error in refreshNewAccount");
      reportErrorAuto("refreshNewAccount", error, { accountId });
    }
  }
}

// Create a singleton instance
const balancePollingService = new BalancePollingService();

// Export convenience functions
export const startBalancePolling = () => balancePollingService.start();
export const retryAccountBalance = (accountId: string) =>
  balancePollingService.retryAccount(accountId);
export const refreshNewAccount = (accountId: string) =>
  balancePollingService.refreshNewAccount(accountId);

// Removed unused exports: stopBalancePolling, restartBalancePolling, triggerBalancePoll, isBalancePollingRunning, balancePollingService
