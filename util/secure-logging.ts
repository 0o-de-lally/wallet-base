/**
 * Production-safe logging utilities
 *
 * Provides logging functions that respect production environment settings
 * and avoid exposing sensitive information in production builds.
 */

import { reportErrorAuto } from "./error-utils";

// Check if we're in development mode
const isDevelopment = __DEV__ || process.env.NODE_ENV === "development";

/**
 * Safe console.log that only logs in development
 */
export function devLog(...args: any[]): void {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Safe console.warn that only logs in development
 */
export function devWarn(...args: any[]): void {
  if (isDevelopment) {
    console.warn(...args);
  }
}

/**
 * Safe console.error that logs in development and reports in production
 */
export function devError(context: string, error: any, ...args: any[]): void {
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
  context?: Record<string, any>,
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
  context: Record<string, any>,
): Record<string, any> {
  const sensitiveKeys = [
    "pin",
    "password",
    "mnemonic",
    "privateKey",
    "seed",
    "key",
    "secret",
  ];
  const filtered: Record<string, any> = {};

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
 */
export function perfLog(operation: string, startTime: number): void {
  if (isDevelopment) {
    const duration = Date.now() - startTime;
    console.log(`[PERF] ${operation}: ${duration}ms`);
  }
}

/**
 * Audit logging for security events
 */
export function auditLog(event: string, context?: Record<string, any>): void {
  const safeContext = context ? filterSensitiveData(context) : undefined;

  if (isDevelopment) {
    console.log(`[AUDIT] ${event}`, safeContext);
  }

  // In production, these could be sent to a security monitoring service
  // For now, we'll just ensure they don't contain sensitive data
}
