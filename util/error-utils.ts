/**
 * Utility functions for error handling across the application
 */

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
 */
export function logError(
  context: string,
  error: unknown,
  level: "warn" | "error" = "warn",
): void {
  const message = getSafeErrorMessage(error);

  if (level === "warn") {
    console.warn(`[${context}] ${message}`);
  } else {
    console.error(`[${context}] ${message}`);
  }
}

/**
 * Error category type for better error handling
 */
export type ErrorCategory = {
  type: "network" | "api" | "timeout" | "unknown";
  shouldLog: boolean;
};

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
