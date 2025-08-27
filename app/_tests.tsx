// Test module exposure for development mode
// This component exposes test modules globally for debugger access

import React from "react";
import { loadTestFunctions, createRunAllTests } from "../util/test-utils";

const TestModuleExposer: React.FC = () => {
  // Load test functions at compile time using the utility function
  const testFunctions = React.useMemo(() => loadTestFunctions(), []);

  // Create the runAllTests function with the test functions
  const runAllTests = React.useMemo(() => createRunAllTests(testFunctions), [testFunctions]);

  // Update global objects when component mounts
  React.useEffect(() => {
    (globalThis as any).__TEST_MODULES__ = {
      runAllTests,
      testCount: testFunctions.length,
    };
    
    console.log(`Exposed ${testFunctions.length} test functions to global scope`);
  }, [testFunctions, runAllTests]);

  return null;
};

export default TestModuleExposer;
