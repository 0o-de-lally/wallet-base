# React Native Test Harness Architecture

This document explains the technical architecture and design philosophy behind the React Native Test Harness.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Technical Architecture](#technical-architecture)
- [Chrome DevTools Protocol Integration](#chrome-devtools-protocol-integration)
- [Device-side Test Exposure](#device-side-test-exposure)
- [Runtime Separation Strategy](#runtime-separation-strategy)
- [Test Discovery and Execution Flow](#test-discovery-and-execution-flow)
- [Comparison with Traditional Testing](#comparison-with-traditional-testing)

## Testing Philosophy

### Why Test on Target Runtime?

The React Native Test Harness is built on the principle that **tests should run in the same environment as production code**. This philosophy diverges from traditional React Native testing approaches for several critical reasons:

#### The Problem with Mocks and Simulations

Traditional testing tools like `jest-expo`, `@testing-library/react-native`, and others rely heavily on:

1. **JavaScript Environment Simulation** - Running React Native code in Node.js environment
2. **Native Module Mocking** - Replacing native modules with JavaScript stubs
3. **Platform API Simulation** - Mocking platform-specific behaviors
4. **Runtime Environment Abstraction** - Abstracting away the actual React Native runtime

**These approaches create a fundamental disconnect between test and production environments.**

#### Real-World Problems with Mock-Based Testing

```typescript
// Traditional approach - runs in Node.js with mocks
import { SecureStore } from 'expo-secure-store';
jest.mock('expo-secure-store'); // This is NOT the real SecureStore!

test('save secure data', async () => {
  await SecureStore.setItemAsync('key', 'value');
  // ✅ Test passes with mock
  // ❌ Real app might fail due to platform-specific issues
});
```

**Problems with this approach:**

- **False Positives**: Tests pass but real app fails
- **Missing Edge Cases**: Platform-specific bugs are never caught
- **API Mismatches**: Mocks may not match real API behavior
- **Runtime Differences**: JavaScript engine differences (Node.js vs React Native)
- **Native Bridge Issues**: Communication with native modules is never tested

#### Our Solution: Device-side Testing

```typescript
// Our approach - runs on actual React Native runtime
import { test } from '@wallet-test/rn-test-harness/device';
import { expect } from './expect_lib';
import * as SecureStore from 'expo-secure-store';

test('save secure data', async () => {
  // This runs on the ACTUAL device with the REAL SecureStore
  await SecureStore.setItemAsync('key', 'value');
  const result = await SecureStore.getItemAsync('key');
  expect(result).toBe('value'); // Tests real platform behavior
});
```

**Benefits:**

- **Real Environment**: Tests run on actual React Native runtime
- **Native Module Access**: Direct access to platform APIs without mocking
- **Platform Specificity**: Catch iOS vs Android differences
- **Production Parity**: Test environment matches production exactly
- **Runtime Validation**: JavaScript engine behavior is identical

### When to Use Device Testing vs Traditional Testing

| Scenario | Device Testing | Traditional Testing |
|----------|----------------|-------------------|
| Business Logic | ✅ Preferred | ✅ Acceptable |
| Native Module Integration | ✅ Required | ❌ Unreliable |
| Platform-specific Code | ✅ Required | ❌ Cannot test |
| UI Component Logic | ✅ Preferred | ✅ Acceptable |
| Performance Testing | ✅ Required | ❌ Cannot test |
| Network/API Testing | ✅ Real behavior | ⚠️ Mocked only |

## Technical Architecture

### High-Level Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Node.js       │    │   Chrome         │    │  React Native   │
│   Test Runner   │◄──►│   DevTools       │◄──►│     App         │
│                 │    │   Protocol       │    │   (Device)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐            ┌─────────┐            ┌─────────────┐
    │CLI Tool │            │WebSocket│            │Test Modules │
    │         │            │ Bridge  │            │  Exposer    │
    └─────────┘            └─────────┘            └─────────────┘
```

### Component Architecture

```typescript
// Node.js Side (Test Runner)
┌─────────────────────────────────────┐
│           CLI Interface             │
├─────────────────────────────────────┤
│         UnitTestHarness            │
├─────────────────────────────────────┤
│    ReactNativeDebugClient         │
├─────────────────────────────────────┤
│       WebSocket Connection         │
└─────────────────────────────────────┘

// React Native Side (Device)
┌─────────────────────────────────────┐
│        TestModuleExposer           │
├─────────────────────────────────────┤
│     Test Discovery System          │
├─────────────────────────────────────┤
│       Test Registration            │
├─────────────────────────────────────┤
│    globalThis.__TEST_MODULES__     │
└─────────────────────────────────────┘
```

## Chrome DevTools Protocol Integration

### How Debug Connection Works

React Native applications, when running with Metro bundler, expose a debug interface compatible with Chrome DevTools Protocol. Our harness leverages this existing infrastructure:

#### 1. Debug Target Discovery

```typescript
// ReactNativeDebugClient discovers available debug targets
async initialize() {
  // Query Metro's debug endpoint
  const response = await fetch('http://localhost:8081/json');
  const targets = await response.json();
  
  // Find React Native context
  const rnTarget = targets.find(target => 
    target.title.includes('React Native') || 
    target.type === 'node'
  );
}
```

#### 2. WebSocket Connection

```typescript
// Establish WebSocket connection to debug target
const wsUrl = target.webSocketDebuggerUrl;
this.ws = new WebSocket(wsUrl);

// Set up Chrome DevTools Protocol communication
this.ws.on('message', (data) => {
  const message = JSON.parse(data);
  // Handle CDP responses
});
```

#### 3. JavaScript Execution

```typescript
// Execute JavaScript in React Native context
async executeJavaScript(expression: string) {
  const message = {
    id: this.messageId++,
    method: 'Runtime.evaluate',
    params: {
      expression: expression,
      awaitPromise: true,
      returnByValue: true
    }
  };
  
  return new Promise((resolve, reject) => {
    this.ws.send(JSON.stringify(message));
    // Handle response...
  });
}
```

### Protocol Message Flow

```
Node.js Test Runner                    React Native Device
       │                                       │
       │ ──── WebSocket Connection ───────────► │
       │                                       │
       │ ──── Runtime.evaluate ──────────────► │
       │      "globalThis.__TEST_MODULES__     │
       │       .runAllTests()"                 │
       │                                       │
       │ ◄─── Test Results JSON ─────────────── │
       │                                       │
       │ ──── Runtime.evaluate ──────────────► │
       │      "2 + 2" (custom test)            │
       │                                       │
       │ ◄─── Execution Result ────────────────── │
```

## Device-side Test Exposure

### The `__DEV__` Context Requirement

React Native applications must explicitly expose test modules in development mode. This is a security and performance consideration:

```typescript
// In your React Native app (_layout.tsx, App.tsx, etc.)
import { TestModuleExposer } from '@wallet-test/rn-test-harness/device';

export default function App() {
  return (
    <View>
      {/* Your app content */}
      
      {/* CRITICAL: Only in development */}
      {__DEV__ && <TestModuleExposer />}
    </View>
  );
}
```

**Why the `__DEV__` requirement?**

1. **Security**: Test modules should never be exposed in production
2. **Performance**: Test code increases bundle size and memory usage
3. **Debugging**: Only needed when debugging/testing is active
4. **Bundle Optimization**: Production builds exclude `__DEV__` code

### Test Module Exposure Mechanism

The `TestModuleExposer` component performs several critical functions:

#### 1. Test Discovery

```typescript
// TestModuleExposer uses webpack's require.context for compile-time discovery
const testModules = require.context('../', true, /\.test\.tsx$/);

testModules.keys().forEach(modulePath => {
  try {
    testModules(modulePath); // Import and execute test file
  } catch (error) {
    console.error(`Failed to load test module: ${modulePath}`, error);
  }
});
```

#### 2. Global Test Registry

```typescript
// Device-side test registration
let allTests: TestFunction[] = [];
let testResults: TestResult[] = [];

// Tests register themselves using this function
export function test(name: string, testFn: () => void) {
  allTests.push({ name, testFn });
}
```

#### 3. Debug Protocol Interface

```typescript
// Expose test execution interface to Chrome DevTools Protocol
useEffect(() => {
  globalThis.__TEST_MODULES__ = {
    runAllTests: () => {
      testResults = [];
      
      allTests.forEach(({ name, testFn }) => {
        try {
          testFn();
          testResults.push({ name, passed: true });
        } catch (error) {
          testResults.push({ 
            name, 
            passed: false, 
            error: error.message 
          });
        }
      });
      
      return {
        results: testResults,
        summary: {
          total: allTests.length,
          passed: testResults.filter(r => r.passed).length,
          failed: testResults.filter(r => !r.passed).length
        }
      };
    },
    
    testCount: allTests.length
  };
}, []);
```

## Runtime Separation Strategy

### The Node.js/React Native Mixing Problem

A critical challenge in building this harness was preventing Node.js dependencies from being imported into React Native runtime:

```typescript
// PROBLEM: This causes React Native build failures
import WebSocket from 'ws'; // Node.js only
import { TestModuleExposer } from './components'; // React Native only

// React Native cannot import Node.js modules
// Node.js cannot import React Native components
```

### Solution: Entry Point Separation

We solved this using package export maps:

```json
{
  "exports": {
    "./node": {
      "import": "./dist/node.js",
      "require": "./dist/node.js",
      "types": "./dist/node.d.ts"
    },
    "./device": {
      "import": "./dist/device.js",
      "require": "./dist/device.js", 
      "types": "./dist/device.d.ts"
    }
  }
}
```

#### Node.js Entry Point (`/node`)

```typescript
// src/node.ts - Only Node.js compatible exports
export { UnitTestHarness } from './test-harness';
export { ReactNativeDebugClient } from './debug-client';
export { runAllUnitTests } from './test-harness';

// Dependencies: ws, Node.js built-ins
```

#### React Native Entry Point (`/device`)

```typescript
// src/device.ts - Only React Native compatible exports  
export { TestModuleExposer } from './TestModuleExposer';
export { test } from './device-test-utils';

// Dependencies: React, React Native APIs only
```

#### Import Safety

```typescript
// ✅ CORRECT: Node.js test runner
import { runAllUnitTests } from '@wallet-test/rn-test-harness/node';

// ✅ CORRECT: React Native app
import { TestModuleExposer } from '@wallet-test/rn-test-harness/device';

// ❌ WRONG: This would cause build failures
import { runAllUnitTests } from '@wallet-test/rn-test-harness/device';
import { TestModuleExposer } from '@wallet-test/rn-test-harness/node';
```

## Test Discovery and Execution Flow

### Complete Test Execution Sequence

```
1. React Native App Startup
   ├── __DEV__ check passes
   ├── TestModuleExposer renders
   ├── require.context discovers *.test.tsx files
   ├── Test files execute and register via test() function
   └── globalThis.__TEST_MODULES__ exposed

2. Node.js Test Runner Startup  
   ├── UnitTestHarness.initialize()
   ├── Discover debug targets (http://localhost:8081/json)
   ├── Connect via WebSocket to React Native debug context
   └── Connection established

3. Test Execution
   ├── Send: globalThis.__TEST_MODULES__.runAllTests()
   ├── React Native executes all registered tests
   ├── Results collected and JSON serialized
   ├── Response sent back over WebSocket
   └── Node.js processes and displays results

4. Cleanup
   ├── WebSocket connection closed
   ├── Debug session terminated
   └── Process exits with appropriate code
```

### Error Handling Strategy

```typescript
// Device-side error handling
test('example test', () => {
  try {
    // Test code
    expect(something).toBe(expected);
  } catch (error) {
    // Error captured and serialized for transport
    throw new Error(`Test failed: ${error.message}`);
  }
});

// Node.js side error handling
async runDeviceTests() {
  try {
    const result = await this.executeJavaScript(`
      globalThis.__TEST_MODULES__.runAllTests()
    `);
    return JSON.parse(result.value);
  } catch (error) {
    throw new Error(`Device test execution failed: ${error.message}`);
  }
}
```

## Comparison with Traditional Testing

### Feature Comparison Matrix

| Feature | Device Testing (Our Approach) | Traditional Jest/Expo Testing |
|---------|-------------------------------|-------------------------------|
| **Runtime Environment** | ✅ React Native JavaScript Core | ❌ Node.js V8 |
| **Native Modules** | ✅ Real platform APIs | ❌ Mocked/Stubbed |
| **Platform Differences** | ✅ Actual iOS/Android behavior | ❌ Cannot detect |
| **Performance Testing** | ✅ Real device performance | ❌ Node.js performance |
| **Memory Usage** | ✅ Actual memory constraints | ❌ Node.js memory model |
| **Network Stack** | ✅ Platform networking | ❌ Node.js http/fetch |
| **File System** | ✅ Platform file system | ❌ Node.js fs module |
| **Async/Promise Behavior** | ✅ Platform-specific timing | ❌ Node.js event loop |
| **Error Stack Traces** | ✅ Real source maps | ⚠️ Mock source maps |
| **Debugging Experience** | ✅ Chrome DevTools | ✅ Chrome DevTools |

### Why @testing-library/react-native is Inadequate

While [`@testing-library/react-native`](https://www.npmjs.com/package/@testing-library/react-native) is a popular choice for React Native testing, it has fundamental limitations that make it unsuitable for comprehensive application testing:

#### The Simulation Problem

`@testing-library/react-native` runs on top of `react-test-renderer`, which creates a **simulated React Native environment in Node.js**. This approach has several critical flaws:

```typescript
// What @testing-library/react-native does
import { render } from '@testing-library/react-native';

test('SecureStore save', async () => {
  // ❌ This runs in Node.js, not React Native
  // ❌ SecureStore is mocked, not real
  // ❌ No actual platform storage is involved
  const { getByText } = render(<MySecureComponent />);
  // ... test runs against fake environment
});
```

**Problems with this approach:**

1. **Fake Runtime**: Tests run in Node.js V8, not React Native's JavaScript Core
2. **Mock Native Modules**: All platform APIs (SecureStore, AsyncStorage, etc.) are stubbed
3. **No Platform Behavior**: iOS vs Android differences cannot be tested
4. **Synthetic Component Tree**: `react-test-renderer` creates fake DOM-like structures
5. **Mock Bridge**: The React Native bridge to native code is completely simulated

#### react-test-renderer Limitations

The underlying `react-test-renderer` has these fundamental issues for React Native:

```typescript
// react-test-renderer creates this fake structure:
{
  "type": "View",
  "props": {},
  "children": [
    {
      "type": "Text", 
      "props": { "children": "Hello" },
      "children": ["Hello"]
    }
  ]
}
// ❌ This is NOT how React Native actually renders components
// ❌ No actual native Views or Text components are created
// ❌ No platform-specific rendering behavior is tested
```

#### Real-World Failure Examples

Here are scenarios where `@testing-library/react-native` gives false positives:

**Example 1: SecureStore Platform Differences**
```typescript
// @testing-library/react-native test - PASSES ✅
test('saves data securely', async () => {
  await SecureStore.setItemAsync('key', 'value'); // Mocked - always "works"
  expect(await SecureStore.getItemAsync('key')).toBe('value');
});

// Real device behavior - FAILS ❌
// - iOS: Requires keychain access permissions
// - Android: May fail due to hardware security module issues  
// - Biometric lock: User must authenticate first
// - Background mode: Storage may be locked
```

**Example 2: Platform-Specific Components**
```typescript
// @testing-library/react-native test - PASSES ✅  
test('renders platform component', () => {
  const { getByTestId } = render(<PlatformSpecificComponent />);
  expect(getByTestId('my-component')).toBeTruthy();
});

// Real device behavior - FAILS ❌
// - Component may render differently on iOS vs Android
// - Native styling may break layout
// - Platform-specific props may be ignored
// - Accessibility behaviors differ between platforms
```

#### Device Testing vs @testing-library/react-native

| Aspect | Device Testing (Our Approach) | @testing-library/react-native |
|--------|--------------------------------|--------------------------------|
| **Runtime** | ✅ Real React Native JavaScript Core | ❌ Node.js V8 simulation |
| **Native Modules** | ✅ Actual SecureStore, AsyncStorage, etc. | ❌ Mocked implementations |
| **Component Rendering** | ✅ Real native Views and Components | ❌ JSON tree simulation |
| **Platform APIs** | ✅ Real iOS/Android behavior | ❌ Mock responses |
| **Error Conditions** | ✅ Real platform errors (permissions, etc.) | ❌ Synthetic mock errors |
| **Performance** | ✅ Real memory/CPU constraints | ❌ Node.js performance profile |
| **Debugging** | ✅ Real React Native stack traces | ❌ Mock stack traces |
| **Network** | ✅ Platform network stack | ❌ Node.js fetch/http mocks |

#### When to Use Each Approach

**Use Device Testing (Our Approach) for:**
- Native module integration (SecureStore, AsyncStorage, etc.)
- Platform-specific behavior testing
- Cross-platform compatibility validation
- Performance testing under real constraints
- Security and permissions testing
- Network behavior validation

**Use @testing-library/react-native for:**
- Pure component logic (no native dependencies)
- UI interaction patterns (if isolated from platform)
- Snapshot testing (with caution)
- Fast feedback loops during development

**Never rely solely on @testing-library/react-native for:**
- Production confidence in React Native apps
- Native module functionality
- Platform-specific features
- Security-critical components
- Performance validation

#### Historical Context: react-native-test-runner

It's worth noting that [`react-native-test-runner`](https://www.npmjs.com/package/react-native-test-runner) attempted a similar device-side testing approach and was conceptually much more promising than simulation-based tools:

```json
{
  "name": "react-native-test-runner",
  "version": "5.0.0",
  "description": "Run unit tests in react native environment",
  "last-published": "4 years ago"
}
```

**What react-native-test-runner got right:**
- ✅ Recognized the need for device-side testing
- ✅ Attempted to run tests in actual React Native environment
- ✅ Understood that mocking native modules was insufficient

**Why it didn't succeed:**
- ❌ **Abandoned**: Last published 4 years ago (2020), no maintenance
- ❌ **Complexity**: Required complex setup and configuration
- ❌ **Limited tooling**: No modern CLI interface or developer experience
- ❌ **Platform compatibility**: Struggled with newer React Native versions
- ❌ **Documentation**: Poor documentation and examples
- ❌ **Integration**: Difficult to integrate with existing build systems

**Our approach vs react-native-test-runner:**

| Feature | Our RN Test Harness | react-native-test-runner |
|---------|---------------------|--------------------------|
| **Active Maintenance** | ✅ Current, actively developed | ❌ Abandoned 4+ years |
| **Modern RN Support** | ✅ React Native 0.70+ | ❌ Legacy RN versions only |
| **Chrome DevTools Protocol** | ✅ Direct WebSocket connection | ❌ Custom protocol |
| **CLI Interface** | ✅ Simple `rn-test-harness test` | ❌ Complex configuration |
| **TypeScript Support** | ✅ Full TypeScript integration | ⚠️ Limited TypeScript |
| **Test Discovery** | ✅ Automatic `*.test.tsx` discovery | ❌ Manual test registration |
| **Developer Experience** | ✅ Jest/Bun-style `test()` syntax | ❌ Custom test format |
| **Error Reporting** | ✅ Colored output, grouped by file | ❌ Basic text output |
| **Runtime Separation** | ✅ Separate Node.js/RN entry points | ❌ Mixed runtime issues |

The failure of `react-native-test-runner` despite being conceptually correct demonstrates the importance of:
1. **Ongoing maintenance** and community support
2. **Developer experience** that matches modern expectations
3. **Simple integration** with existing toolchains
4. **Comprehensive documentation** and examples

Our implementation learns from both the successes of `react-native-test-runner`'s core concept and its failure to provide a sustainable, maintainable solution.

### Performance Implications

#### Traditional Testing
```bash
# Fast startup, but testing fake environment
$ jest MyComponent.test.js
✓ Tests complete in 50ms
❌ But tests aren't testing real behavior
```

#### Device Testing  
```bash
# Slower startup, but testing real environment  
$ rn-test-harness test
⏱️  Connection: 500ms
⏱️  Test execution: 200ms  
✅ Tests are testing actual production behavior
```

**Trade-off Analysis:**
- **Slower setup** (WebSocket connection, device communication)
- **Real confidence** in test results
- **Catches production issues** that mocks cannot detect
- **Better debugging** when tests fail (real stack traces, real environment)

### Migration Strategy

For teams migrating from traditional testing:

#### Phase 1: Hybrid Approach
```typescript
// Keep existing jest tests for business logic
describe('calculateTax', () => {
  test('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.08)).toBe(8);
  });
});

// Add device tests for React Native specific code
test('should access SecureStore', () => {
  expect(SecureStore.setItemAsync).toBeDefined();
});
```

#### Phase 2: Native Module Focus
```typescript
// Prioritize device testing for native integrations
test('biometric authentication', async () => {
  const result = await LocalAuthentication.authenticateAsync();
  expect(result.success).toBeDefined();
});
```

#### Phase 3: Full Migration
```typescript
// Move all React Native tests to device testing
// Keep jest only for pure JavaScript business logic
```

## Conclusion

The React Native Test Harness represents a paradigm shift from mock-based testing to real-environment testing. By leveraging the Chrome DevTools Protocol and careful runtime separation, we achieve:

1. **Production Parity** - Tests run in the same environment as production
2. **Platform Accuracy** - Real native module behavior and platform differences
3. **Developer Confidence** - When tests pass, the real app works
4. **Better Debugging** - Real stack traces and debugging context

This approach requires more setup complexity but provides significantly higher confidence in test results, making it especially valuable for:

- Apps with heavy native module usage
- Cross-platform applications (iOS/Android differences) 
- Performance-critical applications
- Security-sensitive applications (cryptography, authentication)
- Any application where mocking introduces significant gaps between test and production behavior

The architecture is designed to be extensible and can be adapted for different React Native project structures while maintaining the core principle of testing on target runtime.