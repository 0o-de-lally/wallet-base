# React Native Test Harness

A standalone testing harness for React Native applications that enables device-side unit testing through the Chrome DevTools debugging protocol.

## Features

- 🔌 **Direct Device Connection** - Connect to running React Native apps via Metro debugger
- 🧪 **Device-side Testing** - Execute tests directly on the device/simulator
- 📊 **Rich Reporting** - Colored output with test summaries and success rates
- 🚀 **Zero Dependencies** - Self-contained with minimal external dependencies
- 🎯 **Framework Agnostic** - Works with any test framework or custom test definitions

## Installation

```bash
npm install @wallet-test/rn-test-harness
# or
yarn add @wallet-test/rn-test-harness
```

## Entry Points

This package provides separate entry points to avoid mixing Node.js and React Native code:

- **`@wallet-test/rn-test-harness/node`** - For test runners (Node.js environment)
- **`@wallet-test/rn-test-harness/device`** - For React Native apps (device/simulator)

## Quick Start (Node.js Test Runner)

```typescript
import { runAllUnitTests } from '@wallet-test/rn-test-harness/node';

// Run all device tests
const results = await runAllUnitTests();

console.log(`Tests: ${results.harnessResults.total}`);
console.log(`Passed: ${results.harnessResults.passed}`);
console.log(`Failed: ${results.harnessResults.failed}`);
```

## React Native Integration

```typescript
// In your React Native app (e.g., _layout.tsx)
import { TestModuleExposer } from '@wallet-test/rn-test-harness/device';

// Conditionally render in development
{__DEV__ && <TestModuleExposer />}
```

```typescript
// In test files (*.test.tsx)
import { test } from '@wallet-test/rn-test-harness/device';
import { expect } from './your-expect-lib';

test('my test should work', () => {
  expect(2 + 2).toBe(4);
});
```

## Advanced Usage (Node.js)

```typescript
import { UnitTestHarness } from '@wallet-test/rn-test-harness/node';

const harness = new UnitTestHarness();

try {
  await harness.initialize();
  
  // Run custom JavaScript on device
  await harness.runSingleTest('2 + 2', 'Basic Math');
  
  // Run all device tests
  await harness.runDeviceTests();
  
  await harness.cleanup();
} catch (error) {
  console.error('Test failed:', error);
}
```

## Requirements

- React Native app running with Metro bundler
- Remote debugging enabled (for device connection)
- Test modules exposed via `globalThis.__TEST_MODULES__.runAllTests()`

## API Reference

### `runAllUnitTests()`
Convenience function that initializes harness, runs all tests, and cleans up.

### `UnitTestHarness`
Main test harness class with methods:
- `initialize()` - Connect to React Native debug target
- `runDeviceTests()` - Execute all device-side tests
- `runSingleTest(expression, name)` - Execute custom JavaScript
- `cleanup()` - Disconnect from debug target

### `ReactNativeDebugClient`
Low-level debug client for direct Chrome DevTools Protocol access.

## License

MIT