// Test module exposure for development mode
// This component exposes test modules globally for debugger access

import React from "react";
import { expect } from "bun:test";
import * as SecureStore from "../util/secure-store";


// Bun test examples to verify test runner picks up errors
function testPasses() {
  expect("hello").toBe("hello");
};

function testFails() {
  expect("world").toBe("hello");
};

const TestModuleExposer: React.FC = () => {
  (globalThis as any).__TEST_MODULES__ = {
    SecureStore,
    testPasses,
    testFails
  };

  return null;
};

export default TestModuleExposer;
