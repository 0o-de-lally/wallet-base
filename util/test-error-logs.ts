/**
 * Test utility to generate sample error logs for development
 */

import { reportError, reportErrorAuto } from "./error-utils";

/**
 * Generates sample error logs for testing the error logging system
 */
export function generateSampleErrorLogs(): void {
  console.log("Generating sample error logs for testing...");

  // Simulate various types of errors
  reportError(
    "error",
    "sampleTest",
    new Error("This is a test error message"),
    {
      testData: "sample metadata",
      component: "TestComponent",
    },
  );

  reportError("warn", "networkTest", new Error("Network timeout occurred"), {
    url: "https://api.example.com",
    timeout: 5000,
  });

  reportError("debug", "debugTest", new Error("Debug information"), {
    userId: "user123",
    action: "loadData",
  });

  // Test with different error types
  reportErrorAuto("balanceTest", new Error("504 Gateway Time-out"));
  reportErrorAuto("apiTest", new Error("401 Unauthorized"));
  reportErrorAuto("connectionTest", new Error("ECONNRESET"));

  // Test with string errors
  reportError("warn", "stringTest", "Simple string error message");

  // Test with unknown error types
  reportErrorAuto("unknownTest", {
    message: "Unknown error object",
    code: 500,
  });

  console.log("Sample error logs generated successfully!");
}
