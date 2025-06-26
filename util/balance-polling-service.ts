import { appConfig, getProfileForAccount } from "./app-config-store";
import { getLibraClient } from "./libra-client";
import {
  fetchAndUpdateProfileBalancesWithBackoff,
  clearAccountErrors,
  fetchAndUpdateAccountBalance,
} from "./account-balance";

export class BalancePollingService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly POLL_INTERVAL = 30000; // 30 seconds
  private readonly MAX_ERROR_COUNT = 5; // Skip accounts with more than 5 consecutive errors

  /**
   * Checks if an account should be skipped due to consecutive errors
   */
  private shouldSkipAccount(account: any): boolean {
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
      console.debug(
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
      console.log("Balance polling service is already running");
      return;
    }

    console.log("Starting balance polling service (every 30 seconds)");
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
      console.log("Balance polling service is not running");
      return;
    }

    console.log("Stopping balance polling service");
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
   * Polls balances for the active profile
   */
  private async pollBalances(): Promise<void> {
    try {
      const client = getLibraClient();
      if (!client) {
        console.log("No Libra client available, skipping balance poll");
        return;
      }

      // Get the active account and its profile
      const activeAccountId = appConfig.activeAccountId.get();
      if (!activeAccountId) {
        console.log("No active account, skipping balance poll");
        return;
      }

      const activeProfileName = getProfileForAccount(activeAccountId);
      if (!activeProfileName) {
        console.log("No active profile found, skipping balance poll");
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
        console.log("No accounts in active profile, skipping balance poll");
        return;
      }

      console.log(
        `Polling balances for ${activeProfile.accounts.length} accounts in profile: ${activeProfileName}`,
      );

      // Fetch and update balances for all accounts in the active profile
      await fetchAndUpdateProfileBalancesWithBackoff(
        client,
        activeProfileName,
        activeProfile.accounts,
        (account) => this.shouldSkipAccount(account),
      );

      console.log("Balance polling completed successfully");
    } catch (error) {
      // Categorize the error to determine logging level
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // For network/timeout errors, use debug level logging to reduce console spam
      if (
        errorMessage.includes("504") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("Gateway Time-out") ||
        errorMessage.includes("ECONNRESET")
      ) {
        console.debug(
          "Balance polling encountered network issue:",
          errorMessage.substring(0, 100),
        );
      } else {
        // For other errors, use warn level since polling continues
        console.warn("Balance polling error:", errorMessage);
      }

      // Don't stop the service on error, just log and continue
    }
  }

  /**
   * Manually trigger a balance poll (useful for immediate refresh)
   */
  async triggerPoll(): Promise<void> {
    console.log("Manually triggering balance poll");
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
   * Manually retry balance fetch for a specific account (clears error state)
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
        console.warn(`Account ${accountId} not found for retry`);
        return;
      }

      console.log(
        `Retrying balance fetch for account ${targetAccount.nickname} (${accountId})`,
      );

      // Clear error state
      await clearAccountErrors(accountId);

      // Fetch balance
      const client = getLibraClient();
      if (client) {
        await fetchAndUpdateAccountBalance(client, targetAccount);
      }
    } catch (error) {
      console.warn(`Failed to retry account ${accountId}:`, error);
    }
  }
}

// Create a singleton instance
export const balancePollingService = new BalancePollingService();

// Export convenience functions
export const startBalancePolling = () => balancePollingService.start();
export const stopBalancePolling = () => balancePollingService.stop();
export const restartBalancePolling = () => balancePollingService.restart();
export const triggerBalancePoll = () => balancePollingService.triggerPoll();
export const retryAccountBalance = (accountId: string) =>
  balancePollingService.retryAccount(accountId);
export const isBalancePollingRunning = () => balancePollingService.running;
