/**
 * Test utilities for runtime test execution
 * Provides test discovery, execution, and result formatting
 */

// Wrapper function for debugger test execution
export function runTest(description: string, testFn: () => void) {
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

// Helper function to create a test function (legacy)
export function defineTest(name: string, testFn: () => void) {
  return () => runTest(name, testFn);
}

// Jest/Bun-style test function
const registeredTests: Array<{ name: string, testFn: () => void }> = [];

export function test(name: string, testFn: () => void) {
  registeredTests.push({ name, testFn });
}

// Get all registered tests
export function getRegisteredTests() {
  return registeredTests.map(({ name, testFn }) => defineTest(name, testFn));
}

// Function to run all tests and return results
export function createRunAllTests(testFunctions: (() => any)[]) {
  return () => {
    const results = [];
    for (let i = 0; i < testFunctions.length; i++) {
      try {
        const result = testFunctions[i]();
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
  };
}

// Auto-discover and load test functions from .test.tsx files
export function loadTestFunctions() {
  const allTestFunctions: (() => any)[] = [];
  
  // Clear previously registered tests
  registeredTests.length = 0;
  
  // Auto-discover test files using require.context (compile-time)
  // This creates a webpack context that includes all .test.tsx files
  const testModules = require.context('../', true, /\.test\.tsx$/);
  
  for (const testPath of testModules.keys()) {
    try {
      // Import the test module - this will execute any test() calls
      testModules(testPath);
      
    } catch (error) {
      console.warn(`Failed to load test file ${testPath}:`, error);
      // Add a test that reports the import failure
      allTestFunctions.push(defineTest(`import-error-${testPath.replace(/[^a-zA-Z0-9]/g, '-')}`, () => {
        throw new Error(`Failed to import ${testPath}: ${error}`);
      }));
    }
  }
  
  // Add all registered tests
  allTestFunctions.push(...getRegisteredTests());

  console.log(`Compiled ${allTestFunctions.length} test functions from ${testModules.keys().length} test files`);
  return allTestFunctions;
}