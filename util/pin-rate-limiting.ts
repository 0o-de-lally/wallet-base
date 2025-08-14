/**
 * PIN Rate Limiting Module
 *
 * Implements exponential backoff for PIN verification attempts to prevent
 * brute force attacks. Uses secure storage to maintain attempt counters
 * and lockout timestamps.
 */

import { getValue, saveValue, deleteValue } from "./secure-store";

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockoutUntil?: number;
}

// Rate limiting configuration
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const INITIAL_LOCKOUT_DURATION = 30000; // 30 seconds
const MAX_LOCKOUT_DURATION = 300000; // 5 minutes
const LOCKOUT_MULTIPLIER = 2;

const ATTEMPT_RECORD_KEY = "pin_attempt_record";

/**
 * Gets the current attempt record from secure storage
 */
async function getAttemptRecord(): Promise<AttemptRecord> {
  try {
    const recordJson = await getValue(ATTEMPT_RECORD_KEY);
    if (recordJson) {
      return JSON.parse(recordJson);
    }
  } catch (error) {
    console.error("Error reading attempt record:", error);
  }

  // Return default record if none exists or error occurred
  return {
    count: 0,
    lastAttempt: 0,
  };
}

/**
 * Saves the attempt record to secure storage
 */
async function saveAttemptRecord(record: AttemptRecord): Promise<void> {
  try {
    await saveValue(ATTEMPT_RECORD_KEY, JSON.stringify(record));
  } catch (error) {
    console.error("Error saving attempt record:", error);
    // Don't throw - rate limiting failure shouldn't break the app
  }
}

/**
 * Checks if PIN attempts are currently locked out
 * @returns Object with lockout status and remaining time
 */
export async function checkLockoutStatus(): Promise<{
  isLockedOut: boolean;
  remainingTime: number;
  attemptsRemaining: number;
}> {
  const record = await getAttemptRecord();
  const now = Date.now();

  // Check if we're in an active lockout period
  if (record.lockoutUntil && now < record.lockoutUntil) {
    return {
      isLockedOut: true,
      remainingTime: record.lockoutUntil - now,
      attemptsRemaining: 0,
    };
  }

  // If lockout period has expired, reset the attempt count
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    const resetRecord: AttemptRecord = {
      count: 0,
      lastAttempt: 0,
    };
    await saveAttemptRecord(resetRecord);

    return {
      isLockedOut: false,
      remainingTime: 0,
      attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCKOUT,
    };
  }

  return {
    isLockedOut: false,
    remainingTime: 0,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS_BEFORE_LOCKOUT - record.count),
  };
}

/**
 * Records a failed PIN attempt and applies lockout if necessary
 * @returns Updated lockout status
 */
export async function recordFailedAttempt(): Promise<{
  isLockedOut: boolean;
  remainingTime: number;
  attemptsRemaining: number;
}> {
  const record = await getAttemptRecord();
  const now = Date.now();

  // Increment attempt count
  const newCount = record.count + 1;

  const newRecord: AttemptRecord = {
    count: newCount,
    lastAttempt: now,
  };

  // Check if we need to apply lockout
  if (newCount >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    // Calculate lockout duration with exponential backoff
    const lockoutDuration = Math.min(
      INITIAL_LOCKOUT_DURATION *
        Math.pow(
          LOCKOUT_MULTIPLIER,
          Math.floor(newCount / MAX_ATTEMPTS_BEFORE_LOCKOUT) - 1,
        ),
      MAX_LOCKOUT_DURATION,
    );

    newRecord.lockoutUntil = now + lockoutDuration;

    console.warn(
      `PIN lockout activated for ${lockoutDuration}ms after ${newCount} failed attempts`,
    );
  }

  await saveAttemptRecord(newRecord);

  return checkLockoutStatus();
}

/**
 * Records a successful PIN attempt and resets the counter
 */
export async function recordSuccessfulAttempt(): Promise<void> {
  try {
    // Clear the attempt record on successful authentication
    await deleteValue(ATTEMPT_RECORD_KEY);
  } catch (error) {
    console.error("Error clearing attempt record:", error);
    // Don't throw - this is not critical for functionality
  }
}

/**
 * Manually resets the rate limiting (for administrative purposes)
 */
export async function resetRateLimiting(): Promise<void> {
  try {
    await deleteValue(ATTEMPT_RECORD_KEY);
    console.log("PIN rate limiting reset");
  } catch (error) {
    console.error("Error resetting rate limiting:", error);
    throw error;
  }
}

/**
 * Gets rate limiting status for display purposes
 * @internal - Currently unused but kept for potential status display
 */
/*
async function getRateLimitingStatus(): Promise<{
  totalAttempts: number;
  isActive: boolean;
  lockoutUntil?: number;
}> {
  const record = await getAttemptRecord();
  const status = await checkLockoutStatus();

  return {
    totalAttempts: record.count,
    isActive: status.isLockedOut,
    lockoutUntil: record.lockoutUntil,
  };
}
*/
