#!/usr/bin/env node

/**
 * CLI entry point for rn-test-harness
 */

import { runAllUnitTests } from './node';

async function main() {
  const command = process.argv[2];
  
  if (command === 'test') {
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
      console.error('\nTest runner failed:', (error as Error).message);
      process.exit(1);
    }
  } else {
    console.log('Usage: rn-test-harness test');
    process.exit(1);
  }
}

main();