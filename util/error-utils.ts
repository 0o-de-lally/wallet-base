/**
 * Utility functions for error handling and logging across the application
 */

import { observable } from "@legendapp/state";

/**
 * Error log entry interface
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  level: "error" | "warn" | "debug";
  context: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error category type for better error handling
 */
export type ErrorCategory = {
  type: "network" | "api" | "timeout" | "unknown";
  shouldLog: boolean;
};

/**
 * Observable state for error logs
 */
export const errorLogs = observable<ErrorLogEntry[]>([]);

/**
 * Maximum number of error logs to keep in memory
 */
const MAX_LOG_ENTRIES = 1000;

/**
 * Auto-clear interval (24 hours in milliseconds)
 */
const AUTO_CLEAR_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * Safely extracts a message from an error object without exposing sensitive stack traces
 * @param error The error object
 * @param fallbackMessage Fallback message if error can't be processed
 * @returns A safe error message
 */
export function getSafeErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred",
): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else {
    return fallbackMessage;
  }
}

/**
 * Logs errors in a standardized way without exposing sensitive information
 * @param context The context where the error occurred
 * @param error The error object
 * @param level The logging level
 * Removed unused function: logError
 */

/**
 * Categorizes error types for better handling and logging decisions
 * @param error The error to categorize
 * @returns Error category with type and logging recommendation
 */
export function categorizeError(error: unknown): ErrorCategory {
  const errorMessage =
    (error instanceof Error && error.message) ||
    (typeof error === "string" && error) ||
    (error && typeof error === "object" && "toString" in error
      ? String(error)
      : "") ||
    "";

  // Network timeout or connection errors (common and expected)
  if (
    errorMessage.includes("504") ||
    errorMessage.includes("Gateway Time-out") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("ETIMEDOUT") ||
    errorMessage.includes("ECONNRESET") ||
    errorMessage.includes("ECONNREFUSED")
  ) {
    return { type: "timeout", shouldLog: false };
  }

  // Other HTTP errors (5xx server errors, 3xx redirects, etc.)
  if (
    errorMessage.includes("502") ||
    errorMessage.includes("503") ||
    errorMessage.includes("500") ||
    errorMessage.includes("Bad Gateway") ||
    errorMessage.includes("Service Unavailable")
  ) {
    return { type: "network", shouldLog: false };
  }

  // API-specific errors (4xx client errors)
  if (
    errorMessage.includes("400") ||
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("404")
  ) {
    return { type: "api", shouldLog: true };
  }

  // Unknown errors should be logged for debugging
  return { type: "unknown", shouldLog: true };
}

/**
 * Initialize error logging system
 */
export function initializeErrorLogging(): void {
  // Set up auto-clear interval
  setInterval(() => {
    clearOldErrorLogs();
  }, AUTO_CLEAR_INTERVAL);

  console.log("Error logging system initialized");
}

/**
 * Generates a unique ID for error log entries
 */
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Adds an error log entry to the storage
 */
function addErrorLog(entry: Omit<ErrorLogEntry, "id">): void {
  const logEntry: ErrorLogEntry = {
    ...entry,
    id: generateLogId(),
  };

  // Add to beginning of array for chronological order (newest first)
  errorLogs.set([logEntry, ...errorLogs.get()]);

  // Trim logs if we exceed the maximum
  const currentLogs = errorLogs.get();
  if (currentLogs.length > MAX_LOG_ENTRIES) {
    errorLogs.set(currentLogs.slice(0, MAX_LOG_ENTRIES));
  }
}

/**
 * Reports an error with specified level and context
 */
export function reportError(
  level: "error" | "warn" | "debug",
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): void {
  const message = getSafeErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Add to error log storage
  addErrorLog({
    timestamp: Date.now(),
    level,
    context,
    message,
    stack,
    metadata,
  });

  // Also log to console based on level
  const logMessage = `[${context}] ${message}`;

  switch (level) {
    case "error":
      console.error(logMessage, metadata ? { metadata } : "");
      break;
    case "warn":
      console.warn(logMessage, metadata ? { metadata } : "");
      break;
    case "debug":
      console.debug(logMessage, metadata ? { metadata } : "");
      break;
  }
}

/**
 * Reports an error with automatic level detection based on error category
 */
export function reportErrorAuto(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): void {
  const { shouldLog } = categorizeError(error);
  const level = shouldLog ? "warn" : "debug";
  reportError(level, context, error, metadata);
}

/**
 * Gets all error logs
 */
export function getErrorLogs(): ErrorLogEntry[] {
  return errorLogs.get();
}

/**
 * Clears all error logs
 */
export function clearErrorLogs(): void {
  errorLogs.set([]);
}

/**
 * Clears error logs older than specified time
 */
export function clearOldErrorLogs(
  olderThanMs: number = AUTO_CLEAR_INTERVAL,
): void {
  const cutoffTime = Date.now() - olderThanMs;
  const currentLogs = errorLogs.get();
  const filteredLogs = currentLogs.filter((log) => log.timestamp > cutoffTime);

  if (filteredLogs.length !== currentLogs.length) {
    errorLogs.set(filteredLogs);
    console.debug(
      `Cleared ${currentLogs.length - filteredLogs.length} old error logs`,
    );
  }
}

/**
 * Gets error log statistics
 */
export function getErrorLogStats(): {
  total: number;
  byLevel: Record<string, number>;
  byContext: Record<string, number>;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  const logs = errorLogs.get();

  const byLevel: Record<string, number> = {};
  const byContext: Record<string, number> = {};
  let oldestTimestamp: number | null = null;
  let newestTimestamp: number | null = null;

  logs.forEach((log) => {
    // Count by level
    byLevel[log.level] = (byLevel[log.level] || 0) + 1;

    // Count by context
    byContext[log.context] = (byContext[log.context] || 0) + 1;

    // Track timestamps
    if (oldestTimestamp === null || log.timestamp < oldestTimestamp) {
      oldestTimestamp = log.timestamp;
    }
    if (newestTimestamp === null || log.timestamp > newestTimestamp) {
      newestTimestamp = log.timestamp;
    }
  });

  return {
    total: logs.length,
    byLevel,
    byContext,
    oldestTimestamp,
    newestTimestamp,
  };
}
