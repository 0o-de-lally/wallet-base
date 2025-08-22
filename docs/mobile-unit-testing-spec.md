# Mobile Unit Testing Framework Specification

## Problem Statement

Traditional unit testing frameworks (Jest, Mocha, etc.) run in Node.js environments and cannot accurately test mobile applications because:

1. **Different Cryptographic Implementations**: Node.js crypto differs from React Native/mobile crypto
2. **Missing Hardware Integration**: Cannot access device security features (Keystore, biometrics)
3. **Platform Inconsistencies**: Mobile-specific APIs and behaviors cannot be replicated
4. **Secure Storage Differences**: Mock implementations don't match actual SecureStore behavior

## Solution: Visual Mobile Unit Test Framework

A **visual test runner** that executes unit tests directly on mobile devices/emulators, making results visible and verifiable through UI automation tools like Maestro.

## Requirements

### Functional Requirements

1. **Native Test Execution**: Tests run in the actual React Native runtime on real devices/emulators
2. **Visual Test Results**: Test results displayed in UI components that can be verified by automation tools
3. **Hierarchical Test Organization**: Support for test suites, describe blocks, and individual test cases
4. **Real-time Feedback**: Live test execution with progress indicators
5. **Detailed Reporting**: Success/failure states with error messages and stack traces
6. **Test Discovery**: Automatic discovery of test files following naming conventions
7. **Isolation**: Each test runs in isolation to prevent state leakage
8. **Async Support**: Full support for async/await and Promise-based tests

### Non-Functional Requirements

1. **Performance**: Fast test execution without blocking the UI thread
2. **Reliability**: Consistent results across different devices and Android versions
3. **Debuggability**: Clear error reporting and stack traces for failed tests
4. **Extensibility**: Plugin system for custom assertions and test utilities
5. **CI Integration**: Results exportable in formats consumable by CI systems

## Architecture

### Core Components

#### 1. Test Runner Engine (`util/test-runner.ts`)
```typescript
interface TestRunner {
  discoverTests(): TestSuite[]
  executeTests(suites: TestSuite[]): Promise<TestResults>
  onTestStart(callback: (test: TestCase) => void): void
  onTestComplete(callback: (result: TestResult) => void): void
}
```

#### 2. Test Registry (`util/test-registry.ts`)
```typescript
interface TestRegistry {
  describe(name: string, fn: () => void): void
  it(name: string, fn: () => Promise<void> | void): void
  beforeEach(fn: () => Promise<void> | void): void
  afterEach(fn: () => Promise<void> | void): void
}
```

#### 3. Visual Test UI (`components/testing/TestRunnerUI.tsx`)
- **Test Suite List**: Expandable tree view of test suites
- **Progress Bar**: Overall test execution progress
- **Real-time Results**: Live updating test status (pending/running/passed/failed)
- **Error Details**: Expandable error messages and stack traces
- **Summary Statistics**: Pass/fail counts and execution time

#### 4. Assertion Library (`util/assertions.ts`)
```typescript
interface Assertions {
  expect(actual: any): AssertionChain
  // Mobile-specific assertions
  expectSecureStorageValue(key: string, expected: any): Promise<void>
  expectBiometricAvailable(): Promise<void>
  expectCryptoOperation(fn: () => Promise<any>): Promise<AssertionChain>
}
```

#### 5. Test File System (`tests/`)
```
tests/
├── unit/
│   ├── crypto/
│   │   ├── key-generation.test.ts
│   │   ├── encryption.test.ts
│   │   └── mnemonic.test.ts
│   ├── storage/
│   │   ├── secure-store.test.ts
│   │   └── user-state.test.ts
│   └── utils/
│       ├── format-utils.test.ts
│       └── validation.test.ts
├── integration/
│   ├── account-creation.test.ts
│   ├── password-flow.test.ts
│   └── transaction-flow.test.ts
└── setup/
    ├── test-helpers.ts
    └── mock-data.ts
```

### Data Flow

1. **Test Discovery**: Runner scans `tests/` directory for `*.test.ts` files
2. **Test Registration**: Each test file registers tests with the registry
3. **UI Initialization**: Test runner UI displays discovered test tree
4. **Execution**: User triggers test run (or automated via Maestro)
5. **Real-time Updates**: UI updates as tests execute
6. **Result Display**: Final results shown with pass/fail status
7. **Automation Verification**: Maestro verifies UI shows expected results

### Integration Points

#### Maestro Integration
```yaml
# maestro/unit-tests.yaml
appId: com.carpe.wallet
---
- runFlow:
    file: navigate-to-test-runner.yaml
- tapOn: "Run All Tests"
- waitForAnimationToEnd
- assertVisible: "All tests passed"
# or
- assertVisible: 
    text: "Tests: 45 passed, 0 failed"
```

#### CI Integration
- Export test results to JSON format accessible via adb
- Maestro can verify success/failure and extract detailed results
- Failed tests block CI pipeline through Maestro assertions

## Technical Implementation Details

### Test Execution Model

```typescript
// Test execution in React Native runtime
const testSuite: TestSuite = {
  name: "Crypto Operations",
  tests: [
    {
      name: "should generate secure random bytes",
      fn: async () => {
        // This runs in actual React Native environment
        const bytes = await generateSecureRandom(32);
        expect(bytes).toHaveLength(32);
        expect(bytes).toBeInstanceOf(Uint8Array);
      }
    }
  ]
};
```

### State Management Integration

```typescript
// Tests can access real application state
import { userState } from '../util/user-state';

describe('User State Management', () => {
  it('should persist user preferences', async () => {
    await userState.setPreference('theme', 'dark');
    const theme = await userState.getPreference('theme');
    expect(theme).toBe('dark');
  });
});
```

### Error Handling

```typescript
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: {
    message: string;
    stack: string;
    type: string;
  };
}
```

## Security Considerations

1. **Test Data Isolation**: Test data must not interfere with production data
2. **Secure Storage Testing**: Tests must use separate storage contexts
3. **Cryptographic Testing**: Real crypto operations with test keys only
4. **Network Isolation**: Tests use mock endpoints, not production APIs

## Benefits

1. **Accurate Testing**: Tests run in the exact same environment as production code
2. **Hardware Integration**: Can test actual device security features
3. **Visual Verification**: Test results visible and verifiable by automation
4. **CI Integration**: Fully automated through Maestro verification
5. **Developer Experience**: Real-time visual feedback during test development
6. **Debugging**: Full React Native debugging tools available during test execution

## Migration Strategy

1. **Phase 1**: Core test runner infrastructure
2. **Phase 2**: Basic assertion library and UI
3. **Phase 3**: Crypto and storage test utilities
4. **Phase 4**: Integration with existing e2e pipeline
5. **Phase 5**: Comprehensive test coverage migration

This framework bridges the gap between traditional unit testing and e2e testing, providing accurate unit-level testing in the actual mobile runtime environment.