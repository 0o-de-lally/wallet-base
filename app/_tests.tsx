// Test module exposure for development mode
// This component exposes test modules globally for debugger access

import React from "react";
import * as SecureStore from "../util/secure-store";
import expect from "expect";

// Test functions for debugger access using expect library
function testPasses() {
  return expect("hello").toBe("hello");
}

function testFails() {
  return expect("world").toBe("hello");
}

const TestModuleExposer: React.FC = () => {
  (globalThis as any).__TEST_MODULES__ = {
    SecureStore,
    testPasses,
    testFails
  };

  return null;
};

export default TestModuleExposer;
