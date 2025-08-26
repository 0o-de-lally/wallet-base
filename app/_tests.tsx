// Test module exposure for development mode
// This component exposes test modules globally for debugger access

import React from "react";
import * as SecureStore from "../util/secure-store";
import { expect } from "../util/expect_lib";

// Wrapper function for debugger test execution
function runTest(description: string, testFn: () => void) {
  if (!(globalThis as any).__TEST_MODULES__) {
    return { error: 'Test modules not available' };
  }

  try {
    testFn();

    return {
      success: true,
      functionCalled: true,
      error: null,
      testName: description
    };
  } catch (error: any) {
    return {
      success: false,
      functionCalled: true,
      error: error.message,
      testName: description
    };
  }
}

// Helper function to create a test function
function defineTest(name: string, testFn: () => void) {
  return () => runTest(name, testFn);
}

// Function to run all tests and return results
function runAllTests() {
  if (!(globalThis as any).__TEST_FUNCTIONS_ARRAY__) {
    return { error: 'Test functions array not available' };
  }

  const results = [];
  for (let i = 0; i < (globalThis as any).__TEST_FUNCTIONS_ARRAY__.length; i++) {
    try {
      const result = (globalThis as any).__TEST_FUNCTIONS_ARRAY__[i]();
      results.push({ index: i, ...result });
    } catch (error: any) {
      results.push({
        index: i,
        success: false,
        error: error.message,
        testName: 'test-' + i
      });
    }
  }

  return { results, totalTests: results.length };
}

const TestModuleExposer: React.FC = () => {
  // Define all test functions using the helper
  const testFunctions = [
    defineTest('test-passes', () => {
      expect("hello").toBe("hello");
    }),
    defineTest('test-fails', () => {
      expect("world").toBe("hello");
    }),
    defineTest('secure-store-basic', () => {
      expect(SecureStore).toBeDefined();
      expect(typeof SecureStore.saveValue).toBe('function');
    }),
  ];

  (globalThis as any).__TEST_MODULES__ = {
    SecureStore,
    runAllTests,
  };

  // Expose test functions array for iteration
  (globalThis as any).__TEST_FUNCTIONS_ARRAY__ = testFunctions;

  return null;
};

export default TestModuleExposer;
