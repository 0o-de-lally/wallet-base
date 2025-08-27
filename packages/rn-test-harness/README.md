# React Native Test Harness

A standalone testing harness for React Native applications that enables device-side unit testing through the Chrome DevTools debugging protocol.

## Features

- 🔌 **Direct Device Connection** - Connect to running React Native apps via Metro debugger
- 🧪 **Device-side Testing** - Execute tests directly on the device/simulator
- 📊 **Rich Reporting** - Colored output with test summaries and success rates
- 🚀 **Zero Dependencies** - Self-contained with minimal external dependencies
- 🎯 **Framework Agnostic** - Works with any test framework or custom test definitions
- 🔧 **CLI Interface** - Simple command-line interface for running tests

## Why Test on Device?

Unlike traditional React Native testing tools (jest-expo, etc.) that use mocks and simulations, this harness runs your tests directly on the target runtime. This ensures:

- **Real Environment Testing** - Tests run on actual React Native runtime, not Node.js
- **Native Module Access** - Direct access to platform-specific APIs without mocking
- **Runtime Behavior** - Catch platform-specific bugs and runtime differences
- **Production Parity** - Test environment matches your production environment

See [architecture.md](./ARCHITECTURE.md) for detailed explanation of the testing philosophy and technical implementation.

## Installation

```bash
npm install @wallet-test/rn-test-harness
# or
yarn add @wallet-test/rn-test-harness
# or
bun add @wallet-test/rn-test-harness
```

## Entry Points

This package provides separate entry points to avoid mixing Node.js and React Native code:

- **`@wallet-test/rn-test-harness/node`** - For test runners (Node.js environment)
- **`@wallet-test/rn-test-harness/device`** - For React Native apps (device/simulator)

## Quick Start

### 1. Setup React Native App

Add the test module exposer to your React Native app:

```typescript
// In your React Native app (e.g., _layout.tsx or App.tsx)
import { TestModuleExposer } from '@wallet-test/rn-test-harness/device';

export default function App() {
  return (
    <View>
      {/* Your app content */}
      
      {/* Conditionally render in development */}
      {__DEV__ && <TestModuleExposer />}
    </View>
  );
}
```

### 2. Write Tests

Create test files using the familiar Jest/Bun syntax:

```typescript
// components/MyComponent.test.tsx
import { test } from '@wallet-test/rn-test-harness/device';
import { expect } from '../util/expect_lib'; // Your custom expect library

test('should render correctly', () => {
  const result = MyComponent.render();
  expect(result).toBeTruthy();
});

test('should handle user input', () => {
  const component = new MyComponent();
  component.handleInput('test');
  expect(component.value).toBe('test');
});
```

### 3. Run Tests

Use the CLI to run your tests:

```bash
# Using the CLI directly
bun run rn-test-harness test

# Or add to your package.json scripts
{
  "scripts": {
    "test:unit": "rn-test-harness test"
  }
}

# Then run
bun run test:unit
```

## Advanced Usage

### Direct API Usage (Node.js)

```typescript
import { UnitTestHarness, runAllUnitTests } from '@wallet-test/rn-test-harness/node';

// Simple usage - runs all tests and cleans up
async function simpleTest() {
  const results = await runAllUnitTests();
  
  console.log(`Tests: ${results.harnessResults.total}`);
  console.log(`Passed: ${results.harnessResults.passed}`);
  console.log(`Failed: ${results.harnessResults.failed}`);
}

// Advanced usage - manual control
async function advancedTest() {
  const harness = new UnitTestHarness();
  
  try {
    await harness.initialize();
    
    // Run custom JavaScript on device
    await harness.runSingleTest('2 + 2', 'Basic Math');
    await harness.runSingleTest('typeof globalThis', 'Global Object Check');
    
    // Run all device tests
    await harness.runDeviceTests();
    
    await harness.cleanup();
  } catch (error) {
    console.error('Test failed:', error);
    await harness.cleanup();
  }
}
```

### Custom Test Discovery

The harness automatically discovers test files matching `*.test.tsx` pattern. You can customize this by modifying the `TestModuleExposer` component:

```typescript
import { TestModuleExposer } from '@wallet-test/rn-test-harness/device';

// Custom test discovery
function CustomTestExposer() {
  useEffect(() => {
    // Your custom test module exposure logic
    const testModules = require.context('../', true, /\.spec\.tsx$/);
    // ... expose tests to globalThis.__TEST_MODULES__
  }, []);

  return null;
}
```

### Workspace Integration

Add to your workspace `package.json`:

```json
{
  "scripts": {
    "test:unit": "rn-test-harness test",
    "test:watch": "rn-test-harness test --watch" 
  },
  "devDependencies": {
    "@wallet-test/rn-test-harness": "^1.0.0"
  }
}
```

## Test Structure

### Basic Test Pattern

```typescript
import { test } from '@wallet-test/rn-test-harness/device';
import { expect } from './expect_lib';

test('string equality should work', () => {
  expect("hello").toBe("hello");
});

test('number comparison should work', () => {
  expect(5).toBeGreaterThan(3);
  expect(2).toBeLessThan(10);
});

test('boolean values should be truthy/falsy', () => {
  expect(true).toBeTruthy();
  expect(false).toBeFalsy();
});
```

### Testing React Native Components

```typescript
import { test } from '@wallet-test/rn-test-harness/device';
import { expect } from './expect_lib';
import * as SecureStore from 'expo-secure-store';

test('should access native modules', () => {
  // Test actual native module access
  expect(SecureStore).toBeDefined();
  expect(typeof SecureStore.setItemAsync).toBe('function');
});

test('should test platform-specific behavior', () => {
  // Test actual platform behavior, not mocks
  const result = Platform.OS === 'ios' ? 'iOS' : 'Android';
  expect(result).toMatch(/^(iOS|Android)$/);
});
```

## Requirements

- React Native app running with Metro bundler
- Remote debugging enabled (for device connection)
- Node.js runtime for test runner
- Test modules exposed via `globalThis.__TEST_MODULES__.runAllTests()`

## CLI Commands

```bash
# Run all tests
rn-test-harness test

# Show help
rn-test-harness --help
```

## API Reference

### `runAllUnitTests()`
Convenience function that initializes harness, runs all tests, and cleans up.

**Returns:** `Promise<{deviceResults: DeviceTestResults, harnessResults: HarnessResults}>`

### `UnitTestHarness`
Main test harness class with methods:

#### `initialize()` 
Connect to React Native debug target.

#### `runDeviceTests()` 
Execute all device-side tests.

#### `runSingleTest(expression: string, name: string)` 
Execute custom JavaScript expression.

#### `cleanup()` 
Disconnect from debug target.

### `ReactNativeDebugClient`
Low-level debug client for direct Chrome DevTools Protocol access.

### Device-side Functions

#### `test(name: string, fn: () => void)`
Register a test function for execution.

#### `TestModuleExposer`
React component that exposes test modules to the debug protocol.

## Troubleshooting

### Connection Issues
- Ensure Metro bundler is running
- Verify remote debugging is enabled
- Check that the React Native app is running and accessible

### Test Discovery Issues
- Verify `TestModuleExposer` is rendered in development mode
- Check that test files follow the `*.test.tsx` naming pattern
- Ensure test files are being imported/required correctly

### Build Issues
- Make sure to use the correct entry points (`/node` vs `/device`)
- Verify TypeScript compilation is complete
- Check for environment-specific dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Architecture

For detailed information about the technical implementation and testing philosophy, see [ARCHITECTURE.md](./ARCHITECTURE.md).