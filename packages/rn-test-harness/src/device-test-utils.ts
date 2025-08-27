/**
 * Device-side test utilities for React Native testing
 * These run inside the React Native app and expose test functionality to the debugger
 */

// Wrapper function for debugger test execution
export function runTest(description: string, testFn: () => void) {
  if (!(globalThis as any).__TEST_MODULES__) {
    return { error: "Test modules not available" };
  }

  try {
    testFn();

    return {
      success: true,
      functionCalled: true,
      error: null,
      testName: description,
    };
  } catch (error: any) {
    return {
      success: false,
      functionCalled: true,
      error: error.message,
      testName: description,
    };
  }
}

// Helper function to create a test function (legacy)
export function defineTest(name: string, testFn: () => void) {
  return () => runTest(name, testFn);
}

// Jest/Bun-style test function
const registeredTests: Array<{
  name: string;
  testFn: () => void;
  filename?: string;
}> = [];

export function test(name: string, testFn: () => void) {
  const filename = (globalThis as any).__CURRENT_TEST_FILE__ || "unknown";
  registeredTests.push({ name, testFn, filename });
}

// Get all registered tests
export function getRegisteredTests() {
  return registeredTests.map(({ name, testFn, filename }) => ({
    testFunction: defineTest(name, testFn),
    filename,
    testName: name,
  }));
}

// Function to run all tests and return results
export function createRunAllTests(
  testObjects: Array<{
    testFunction: () => any;
    filename?: string;
    testName?: string;
  }>,
) {
  return () => {
    const results = [];
    for (let i = 0; i < testObjects.length; i++) {
      try {
        const testObj = testObjects[i];
        const result = testObj.testFunction();
        results.push({
          index: i,
          filename: testObj.filename,
          ...result,
        });
      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error.message,
          testName: testObjects[i].testName || "test-" + i,
          filename: testObjects[i].filename,
        });
      }
    }

    return { results, totalTests: results.length };
  };
}

// Auto-discover and load test functions from .test.tsx files
export function loadTestFunctions() {
  const allTestObjects: Array<{
    testFunction: () => any;
    filename?: string;
    testName?: string;
  }> = [];

  // Clear previously registered tests
  registeredTests.length = 0;

  try {
    // Auto-discover test files using require.context (compile-time)
    // This creates a webpack context that includes all .test.tsx files
    // @ts-ignore - require.context is a webpack feature
    const testModules = require.context("../../../", true, /\.test\.tsx$/);

    for (const testPath of testModules.keys()) {
      try {
        // Set current filename for test registration
        (globalThis as any).__CURRENT_TEST_FILE__ = testPath;

        // Import the test module - this will execute any test() calls
        testModules(testPath);

        // Clear current filename
        delete (globalThis as any).__CURRENT_TEST_FILE__;
      } catch (error) {
        console.warn(`Failed to load test file ${testPath}:`, error);
        // Add a test that reports the import failure
        allTestObjects.push({
          testFunction: defineTest(
            `import-error-${testPath.replace(/[^a-zA-Z0-9]/g, "-")}`,
            () => {
              throw new Error(`Failed to import ${testPath}: ${error}`);
            },
          ),
          filename: testPath,
          testName: `Import Error: ${testPath}`,
        });
      }
    }

    console.log(`Discovered ${testModules.keys().length} test files`);
  } catch (error) {
    console.warn(
      "require.context not available (not in webpack environment):",
      error,
    );
    // Fallback: no test file discovery available
  }

  // Add all registered tests
  allTestObjects.push(...getRegisteredTests());

  console.log(`Compiled ${allTestObjects.length} test functions`);
  return allTestObjects;
}
