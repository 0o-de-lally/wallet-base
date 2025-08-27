/**
 * Standalone unit test harness for device-side React Native tests
 * No dependencies on external test frameworks - creates its own test logging facade
 */

import { ReactNativeDebugClient, connectToFirstTarget } from './debug-client';

// Simple test logger facade
export class TestLogger {
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

// Simple assertion functions (no external dependencies)
function assert(condition: boolean, message: string = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDefined(value: any, message?: string) {
  if (value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

function assertGreaterThan(actual: number, expected: number, message?: string) {
  if (actual <= expected) {
    throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
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
      // First check if test modules are available
      const testModulesAvailable = await this.debugClient.evaluateJavaScript(`
        typeof globalThis.__TEST_MODULES__ !== 'undefined' && typeof globalThis.__TEST_MODULES__.runAllTests === 'function'
      `);

      if (!testModulesAvailable) {
        throw new Error('Test modules not available. Make sure TestModuleExposer is rendered in your React Native app.');
      }

      // Get test results from device
      const testResults = await this.debugClient.evaluateJavaScript(`
        globalThis.__TEST_MODULES__.runAllTests()
      `);

      this.logger.log(`Retrieved ${testResults.totalTests} test results from device`);

      // Validate test results structure using simple assertions
      assertDefined(testResults.results, 'Test results should be defined');
      assertGreaterThan(testResults.totalTests, 0, 'Should have at least one test');

      // Group test results by filename
      const results = testResults.results;
      const resultsByFile: { [filename: string]: any[] } = {};
      
      // Group results by filename
      for (const result of results) {
        const filename = result.filename || 'unknown';
        if (!resultsByFile[filename]) {
          resultsByFile[filename] = [];
        }
        resultsByFile[filename].push(result);
      }

      // Process and display results grouped by filename
      for (const [filename, fileResults] of Object.entries(resultsByFile)) {
        // Clean up filename for display (remove leading path parts)
        const displayName = filename.replace(/^\.\//, '').replace(/^.*\//, '') || filename;
        
        this.logger.log(`\n${displayName}:`);
        
        for (const result of fileResults) {
          if (result.success) {
            this.logger.success(result.testName || `Test ${result.index}`);
          } else {
            this.logger.failure(
              result.testName || `Test ${result.index}`,
              result.error || 'Unknown error'
            );
          }
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
      this.logger.failure(testName, (error as Error).message);
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