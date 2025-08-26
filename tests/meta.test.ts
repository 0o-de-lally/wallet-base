import { test, expect, beforeAll, afterAll } from 'bun:test';
import { ReactNativeDebugClient, connectToFirstTarget } from '../testing/debug-harness';

let debugClient: ReactNativeDebugClient;

beforeAll(async () => {
  debugClient = await connectToFirstTarget();
});

afterAll(() => {
  debugClient?.disconnect();
});


test('should run all device tests', async () => {
  // Use the runAllTests function from the device
  const testResults = await debugClient.evaluateJavaScript(`
    globalThis.__TEST_MODULES__.runAllTests()
  `);

  console.log('All test results:', JSON.stringify(testResults, null, 2));

  expect(testResults.results).toBeDefined();
  expect(testResults.totalTests).toBeGreaterThan(0);

  // Check individual test results
  const results = testResults.results;
  let passedTests = 0;
  let failedTests = 0;

  for (const result of results) {
    console.log(`Test ${result.index} (${result.testName}): ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
      failedTests++;
    } else {
      passedTests++;
    }
  }

  console.log(`\nTest Summary: ${passedTests} passed, ${failedTests} failed, ${results.length} total`);

  // We expect at least one test to pass and one to fail (based on our test setup)
  expect(passedTests).toBeGreaterThan(0);
  expect(failedTests).toBeGreaterThan(0);

}, 30000);
