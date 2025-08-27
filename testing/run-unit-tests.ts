#!/usr/bin/env node

/**
 * Simple runner script for the unit test harness
 * Can be run directly with: bun run testing/run-unit-tests.ts
 */

import { runAllUnitTests, UnitTestHarness } from './unit-test-harness';

async function main() {
  console.log('Starting React Native Unit Test Runner...');
  console.log('=' .repeat(50));
  
  try {
    const results = await runAllUnitTests();
    
    console.log('=' .repeat(50));
    console.log('Final Results:');
    console.log(`   Device Tests: ${results.deviceResults.totalTests} total`);
    console.log(`   Harness Summary: ${results.harnessResults.passed}/${results.harnessResults.total} passed`);
    
    // Exit with appropriate code
    if (results.harnessResults.failed > 0) {
      console.log('\nSome tests failed');
      process.exit(1);
    } else {
      console.log('\nAll tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\nTest runner failed:', error.message);
    process.exit(1);
  }
}

// Advanced usage example
async function runCustomTests() {
  const harness = new UnitTestHarness();
  
  try {
    await harness.initialize();
    
    // Run custom JavaScript expressions
    await harness.runSingleTest('2 + 2', 'Basic Math');
    await harness.runSingleTest('typeof globalThis', 'Global Object Check');
    await harness.runSingleTest('globalThis.__TEST_MODULES__.testCount', 'Test Count Check');
    
    // Run device tests
    await harness.runDeviceTests();
    
    await harness.cleanup();
  } catch (error) {
    console.error('Custom test failed:', error);
    await harness.cleanup();
  }
}

// Run based on command line args
if (process.argv.includes('--custom')) {
  runCustomTests();
} else {
  main();
}