/**
 * Standalone unit test harness for device-side React Native tests
 * No dependencies on Bun/Jest - creates its own test logging facade
 */

import { ReactNativeDebugClient, connectToFirstTarget } from './debug-harness';

// Simple test logger facade
class TestLogger {
  private passedTests = 0;
  private failedTests = 0;
  private totalTests = 0;

  log(message: string) {
    console.log(message);
  }

  success(testName: string) {
    this.passedTests++;
    this.log(`✓ ${testName}`);
  }

  failure(testName: string, error: string) {
    this.failedTests++;
    this.log(`\x1b[31m✗\x1b[0m ${testName}`);
    this.log(`   Error: ${error}`);
  }

  summary() {
    this.totalTests = this.passedTests + this.failedTests;
    this.log('\nTest Summary:');
    this.log(`   Passed: ${this.passedTests}`);
    this.log(`   Failed: ${this.failedTests}`);
    this.log(`   Total:  ${this.totalTests}`);
    this.log(`   Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
  }

  getSummary() {
    return {
      passed: this.passedTests,
      failed: this.failedTests,
      total: this.passedTests + this.failedTests,
      successRate: this.passedTests / (this.passedTests + this.failedTests)
    };
  }
}

// Import our existing expect library for assertions
import { expect, assert } from '../util/expect_lib';

// Convenience assertion wrappers using our expect library
function assertEquals(actual: any, expected: any, message?: string) {
  try {
    expect(actual).toBe(expected);
  } catch (error) {
    throw new Error(message || error.message);
  }
}

function assertGreaterThan(actual: number, expected: number, message?: string) {
  try {
    expect(actual).toBeGreaterThan(expected);
  } catch (error) {
    throw new Error(message || error.message);
  }
}

function assertDefined(value: any, message?: string) {
  try {
    expect(value).toBeDefined();
  } catch (error) {
    throw new Error(message || error.message);
  }
}

// Main test harness
export class UnitTestHarness {
  private debugClient: ReactNativeDebugClient | null = null;
  private logger = new TestLogger();

  async initialize() {
    this.logger.log('Initializing React Native Unit Test Harness...');
    try {
      this.debugClient = await connectToFirstTarget();
      this.logger.log('Connected to React Native debug target');
    } catch (error) {
      this.logger.log(`Failed to connect to debug target: ${error}`);
      throw error;
    }
  }

  async cleanup() {
    if (this.debugClient) {
      this.debugClient.disconnect();
      this.logger.log('Disconnected from debug target');
    }
  }

  async runDeviceTests() {
    if (!this.debugClient) {
      throw new Error('Test harness not initialized. Call initialize() first.');
    }

    this.logger.log('\nRunning device-side tests...');

    try {
      // Get test results from device
      const testResults = await this.debugClient.evaluateJavaScript(`
        globalThis.__TEST_MODULES__.runAllTests()
      `);

      this.logger.log(`Retrieved ${testResults.totalTests} test results from device`);

      // Validate test results structure using our expect library
      expect(testResults.results).toBeDefined();
      expect(testResults.totalTests).toBeGreaterThan(0);

      // Process individual test results
      const results = testResults.results;

      for (const result of results) {
        if (result.success) {
          this.logger.success(result.testName || `Test ${result.index}`);
        } else {
          this.logger.failure(
            result.testName || `Test ${result.index}`,
            result.error || 'Unknown error'
          );
        }
      }

      // Print summary
      this.logger.summary();

      // Return results for programmatic access
      return {
        deviceResults: testResults,
        harnessResults: this.logger.getSummary()
      };

    } catch (error) {
      this.logger.log(`Test execution failed: ${error}`);
      throw error;
    }
  }

  async runSingleTest(testExpression: string, testName: string = 'Custom Test') {
    if (!this.debugClient) {
      throw new Error('Test harness not initialized. Call initialize() first.');
    }

    try {
      const result = await this.debugClient.evaluateJavaScript(testExpression);
      this.logger.success(`${testName}: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.failure(testName, error.message);
      throw error;
    }
  }
}

// Convenience function to run all tests
export async function runAllUnitTests() {
  const harness = new UnitTestHarness();

  try {
    await harness.initialize();
    const results = await harness.runDeviceTests();
    await harness.cleanup();

    return results;
  } catch (error) {
    await harness.cleanup();
    throw error;
  }
}

// Export test utilities for custom test scenarios
export { TestLogger };

// Re-export expect library for convenience
export { expect, assert } from '../util/expect_lib';
