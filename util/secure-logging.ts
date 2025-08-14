/**
 * Production-safe logging utilities
 *
 * Provides logging functions that respect production environment settings
 * and avoid exposing sensitive information in production builds.
 */

import { reportErrorAuto } from "./error-utils";

// Type for console log arguments
type LogValue = string | number | boolean | object | null | undefined;

// Check if we're in development mode
const isDevelopment = __DEV__ || process.env.NODE_ENV === "development";

/**
 * Safe console.log that only logs in development
 */
export function devLog(...args: LogValue[]): void {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Safe console.warn that only logs in development
 * @internal - Currently unused but available for debugging
 */
/*
function devWarn(...args: LogValue[]): void {
  if (isDevelopment) {
    console.warn(...args);
  }
}
*/

/**
 * Safe console.error that logs in development and reports in production
 */
export function devError(context: string, error: unknown, ...args: LogValue[]): void {
  if (isDevelopment) {
    console.error(context, error, ...args);
  } else {
    // In production, use the error reporting system
    reportErrorAuto(context, error);
  }
}

/**
 * Security-focused logging that never logs sensitive data
 */
export function securityLog(
  message: string,
  context?: Record<string, LogValue>,
): void {
  if (isDevelopment) {
    // Filter out potentially sensitive keys
    const safeContext = context ? filterSensitiveData(context) : undefined;
    console.log(`[SECURITY] ${message}`, safeContext);
  }
}

/**
 * Filter out sensitive data from log context
 */
function filterSensitiveData(
  context: Record<string, LogValue>,
): Record<string, LogValue> {
  const sensitiveKeys = [
    "pin",
    "password",
    "mnemonic",
    "privateKey",
    "seed",
    "key",
    "secret",
  ];
  const filtered: Record<string, LogValue> = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      filtered[key] = "[REDACTED]";
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Performance logging for development
 * @internal - Currently unused but available for performance debugging
 */
/*
function perfLog(operation: string, startTime: number): void {
  if (isDevelopment) {
    const duration = Date.now() - startTime;
    console.log(`[PERF] ${operation}: ${duration}ms`);
  }
}
*/

/**
 * Audit logging for security events
 * @internal - Currently unused but available for security auditing
 */
/*
function auditLog(event: string, context?: Record<string, LogValue>): void {
  const safeContext = context ? filterSensitiveData(context) : undefined;

  if (isDevelopment) {
    console.log(`[AUDIT] ${event}`, safeContext);
  }

  // In production, these could be sent to a security monitoring service
  // For now, we'll just ensure they don't contain sensitive data
}
*/
