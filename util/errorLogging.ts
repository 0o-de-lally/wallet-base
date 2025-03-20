import { observable } from '@legendapp/state';
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';

// Define metadata value types
type MetadataValue = string | number | boolean | null | undefined;

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  metadata?: Record<string, MetadataValue>;
}

// Create observable store for errors
export const errorStore$ = observable({
  logs: [] as ErrorLog[],
  lastError: null as ErrorLog | null
});

// Maximum number of logs to keep
const MAX_LOGS = 100;

export class ErrorLogger {
  static logError(error: Error | unknown, metadata?: Record<string, MetadataValue>) {
    const normalizedError = error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : JSON.stringify(error));

    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: normalizedError.message,
      stack: normalizedError.stack,
      metadata
    };

    // Add to observable store
    errorStore$.logs.push(errorLog);
    errorStore$.lastError.set(errorLog);

    // Trim old logs
    if (errorStore$.logs.length > MAX_LOGS) {
      errorStore$.logs.splice(0, errorStore$.logs.length - MAX_LOGS);
    }

    console.error('Error logged:', errorLog);
  }

  static async exportLogs() {
    try {
      const logs = errorStore$.logs.get();
      const content = JSON.stringify(logs, null, 2);

      // Create temporary file
      const fileUri = `${FileSystem.cacheDirectory}/error_logs_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, content);

      // Share file
      await Share.share({
        url: fileUri,
        title: 'Error Logs',
        message: 'Wallet Error Logs'
      });

    } catch (error) {
      console.error('Failed to export logs:', error);
      throw error;
    }
  }

  static clearLogs() {
    errorStore$.logs.set([]);
    errorStore$.lastError.set(null);
  }
}

// Global error handler
export function setupGlobalErrorHandler() {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    ErrorLogger.logError(error, { isFatal } );
    originalHandler(error, isFatal);
  });
}
