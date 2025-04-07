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
