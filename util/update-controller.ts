import { fetchAllAccountBalances } from "./balance-fetcher";
import { fetchAllBlockchainVitals } from "./blockchain-vitals";
// Import the timing functions from React Native
import { InteractionManager } from 'react-native';

// Store the interval ID for cleanup
let updateInterval: NodeJS.Timeout | null = null;

/**
 * Performs all periodic update tasks (account balances and blockchain vitals)
 */
export async function performPeriodicUpdates(): Promise<void> {
  // Use InteractionManager to ensure updates don't interfere with animations/transitions
  InteractionManager.runAfterInteractions(async () => {
    await Promise.all([
      fetchAllAccountBalances(),
      fetchAllBlockchainVitals(),
    ]);
  });
}

/**
 * Starts the background process to periodically update all data
 * @param intervalMs - Interval in milliseconds (default: 15000)
 */
export function startPeriodicUpdates(intervalMs: number = 15000): void {
  if (updateInterval === null) {
    // Initial fetch
    performPeriodicUpdates();

    // Set up periodic fetching using React Native compatible approach
    updateInterval = setInterval(() => {
      performPeriodicUpdates();
    }, intervalMs);
  }
}

/**
 * Stops the background update process
 */
export function stopPeriodicUpdates(): void {
  if (updateInterval !== null) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}
