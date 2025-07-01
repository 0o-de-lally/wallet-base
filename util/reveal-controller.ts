import { IS_PRODUCTION } from "./environment";
import {
  setAccountRevealSchedule,
  getAccountRevealSchedule,
  clearAccountRevealSchedule,
  cleanupExpiredRevealSchedules,
  type RevealSchedule,
} from "./app-config-store";

// Build-time constants for reveal timing based on environment
const WAITING_PERIOD_MS = IS_PRODUCTION
  ? 24 * 60 * 60 * 1000 // 24 hours in production
  : 30 * 1000; // 30 seconds in development/preview

/**
 * Formats the waiting period duration for reveal feature based on current environment
 * @returns A human-readable string describing the waiting period
 */
export function formatWaitingPeriod(): string {
  const waitingPeriodMs = WAITING_PERIOD_MS;

  if (waitingPeriodMs >= 24 * 60 * 60 * 1000) {
    const hours = Math.round(waitingPeriodMs / (60 * 60 * 1000));
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (waitingPeriodMs >= 60 * 1000) {
    const minutes = Math.round(waitingPeriodMs / (60 * 1000));
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    const seconds = Math.round(waitingPeriodMs / 1000);
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
}

// Configuration for the reveal timing windows
export const REVEAL_CONFIG = {
  waitingPeriodMs: WAITING_PERIOD_MS,
  revealWindowMs: 2 * 60 * 1000, // 2 minutes to reveal after available
};

/**
 * Schedules a reveal for a secure value for a specific account.
 * The user must wait for the waiting period before they can reveal the value,
 * and must complete the reveal within the reveal window.
 *
 * @param accountId - The ID of the account to schedule the reveal for
 * @returns The scheduled reveal details or null if failed
 */
export function scheduleReveal(accountId: string): RevealSchedule | null {
  const now = Date.now();
  const schedule: RevealSchedule = {
    scheduledAt: now,
    availableAt: now + REVEAL_CONFIG.waitingPeriodMs,
    expiresAt:
      now + REVEAL_CONFIG.waitingPeriodMs + REVEAL_CONFIG.revealWindowMs,
  };

  const success = setAccountRevealSchedule(accountId, schedule);
  return success ? schedule : null;
}

/**
 * Checks the status of a scheduled reveal for an account.
 *
 * @param accountId - The ID of the account to check
 * @returns Object with status information, or null if no reveal is scheduled
 */
export function checkRevealStatus(accountId: string): {
  scheduled: boolean;
  available: boolean;
  expired: boolean;
  waitTimeRemaining: number;
  expiresIn: number;
} | null {
  const schedule = getAccountRevealSchedule(accountId);
  if (!schedule) {
    return null;
  }

  const now = Date.now();
  const available = now >= schedule.availableAt;
  const expired = now >= schedule.expiresAt;

  // Clean up expired schedules automatically
  if (expired) {
    clearAccountRevealSchedule(accountId);
  }

  return {
    scheduled: true,
    available,
    expired,
    waitTimeRemaining: Math.max(0, schedule.availableAt - now),
    expiresIn: Math.max(0, schedule.expiresAt - now),
  };
}

/**
 * Gets a value if its reveal has been scheduled and is currently available for an account.
 *
 * @param accountId - The ID of the account
 * @returns A Promise that resolves to the value if available within the reveal window, or null otherwise
 * Removed unused function: getScheduledReveal
 */

/**
 * Cancels a scheduled reveal for an account.
 *
 * @param accountId - The ID of the account to cancel the reveal for
 */
export function cancelReveal(accountId: string): void {
  clearAccountRevealSchedule(accountId);
}

/**
 * Clears all scheduled reveals.
 * This calls the cleanup function that removes expired schedules across all accounts.
 */
export function clearAllScheduledReveals(): void {
  cleanupExpiredRevealSchedules();
}

/**
 * Initialize reveal controller - clean up any expired schedules
 * This should be called when the app starts
 */
export function initializeRevealController(): void {
  cleanupExpiredRevealSchedules();
}
