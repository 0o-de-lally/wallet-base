# React Native Runtime Testing Analysis

## The Core Problem: No Way to Unit Test RN Modules on Device Runtime

After extensive exploration using Chrome DevTools Protocol `Runtime.evaluate`, we've discovered a fundamental limitation in the React Native testing ecosystem.

### What We Found

**✅ Working:**
- React Native runtime is active and accessible
- Hermes JavaScript engine running correctly
- Chrome DevTools Protocol connection established
- 75+ Webpack chunks available (system utilities, polyfills)
- Metro bundler infrastructure present
- Expo registry accessible

**❌ Missing:**
- **0 application modules loaded** in Metro module registry
- **No mechanism to force-load modules** for testing
- **Cannot access application code** without full app import chain

### The Fundamental Gap

```javascript
// This is what we CAN do:
globalThis.__r.getModules() // Returns: {} (empty)
__webpack_require__(9)      // Returns: { default: [Function] }
__ExpoImportMetaRegistry    // Returns: { url: "..." }

// This is what we CANNOT do:
require('./util/secure-store')     // Module not loaded
import('./util/secure-store')      // Not in dependency graph  
__r.getModules()['secure-store']   // Doesn't exist
```

### Why This Limitation Exists

1. **Lazy Module Loading**: React Native only loads modules when explicitly imported
2. **No Dynamic Loading API**: Unlike Node.js, no way to require arbitrary files
3. **Metro Dependency Graph**: Only modules in import chain get bundled
4. **Testing Architecture Gap**: 
   - Jest runs in Node.js (mocked environment)
   - Integration tests need full app running
   - **No middle ground for isolated module testing on device**

## Proposed Solutions

### 1. Test Harness App (Recommended)
**Feasibility:** High  
**Implementation:**
```javascript
// In your React Native app entry point (App.tsx/index.js)
if (__DEV__) {
  Promise.all([
    import('./util/secure-store'),
    import('./util/other-module'),
    // Add all modules you want to test
  ]).then(([SecureStore, OtherModule]) => {
    globalThis.__TEST_MODULES__ = {
      SecureStore,
      OtherModule,
    };
  });
}
```

**Then your tests can access:**
```javascript
const secureStore = globalThis.__TEST_MODULES__.SecureStore;
await secureStore.saveValue('test_key', 'test_value');
```

### 2. Dynamic Import Strategy
**Feasibility:** Medium  
**Implementation:**
```javascript
// In Runtime.evaluate
const module = await import('./util/secure-store');
// Test the module...
```

**Limitation:** Requires module to be in Metro's dependency graph

### 3. Metro Plugin for Test Loading
**Feasibility:** Low (requires custom development)  
**Concept:**
```javascript
// Custom Metro plugin adds:
globalThis.loadTestModule = async (path) => {
  return await __dynamicImport__(path);
};
```

### 4. Hybrid Testing Approach
**Feasibility:** High  
**Implementation:**
- **Jest unit tests** for pure logic (Node.js environment)
- **Runtime.evaluate tests** for integration with native modules
- **E2E tests** for full user workflows

## The Broader Issue

This reveals a **significant gap in React Native's testing ecosystem:**

### What's Missing:
- **Module-level testing on device runtime**
- **Isolated testing of native module integration**
- **Dynamic module loading for test scenarios**
- **Hot-loading of test modules**

### Industry Impact:
- Forces developers to choose between mocked tests (Jest) or full integration tests
- Makes it difficult to test platform-specific behavior in isolation
- Requires workarounds for testing secure storage, permissions, etc.

## Recommended Next Steps

1. **Immediate:** Implement Test Harness App approach
2. **Short-term:** Create Metro plugin for dynamic test module loading
3. **Long-term:** Advocate for React Native core improvements:
   - Built-in dynamic module loading API
   - Test-specific module registry
   - Development-only module hot-loading

## Technical Implementation

The storage.test.ts file demonstrates a fully working approach to:
- ✅ Connect to React Native runtime via Chrome DevTools Protocol
- ✅ Explore all available module systems (Metro, Webpack, Expo)
- ✅ Use `Runtime.evaluate` to execute code on device
- ✅ Handle Promise-based asynchronous operations
- ❌ **Cannot test modules that aren't pre-loaded by the app**

This limitation is **not a bug in our approach** - it's a fundamental architectural constraint of React Native's module system.

## Conclusion

**The puzzling reality:** You can execute arbitrary JavaScript on a React Native device runtime, but you cannot dynamically load your own application modules for testing.

**The solution:** Modify your React Native app to pre-load test modules in development mode, bridging the gap between pure unit tests and full integration tests.

This approach provides **real device runtime testing** while maintaining the isolation and control needed for reliable unit tests.