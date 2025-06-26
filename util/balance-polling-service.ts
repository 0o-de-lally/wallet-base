import { appConfig, getProfileForAccount } from "./app-config-store";
import { getLibraClient } from "./libra-client";
import { fetchAndUpdateProfileBalances } from "./account-balance";

export class BalancePollingService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly POLL_INTERVAL = 10000; // 10 seconds

  /**
   * Starts the balance polling service
   */
  start(): void {
    if (this.isRunning) {
      console.log("Balance polling service is already running");
      return;
    }

    console.log("Starting balance polling service (every 10 seconds)");
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
      await fetchAndUpdateProfileBalances(
        client,
        activeProfileName,
        activeProfile.accounts,
      );

      console.log("Balance polling completed successfully");
    } catch (error) {
      console.error("Error during balance polling:", error);
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
}

// Create a singleton instance
export const balancePollingService = new BalancePollingService();

// Export convenience functions
export const startBalancePolling = () => balancePollingService.start();
export const stopBalancePolling = () => balancePollingService.stop();
export const restartBalancePolling = () => balancePollingService.restart();
export const triggerBalancePoll = () => balancePollingService.triggerPoll();
export const isBalancePollingRunning = () => balancePollingService.running;
