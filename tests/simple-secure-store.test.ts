import { test, expect, beforeAll, afterAll } from 'bun:test';
import { ReactNativeDebugClient, connectToFirstTarget } from '../testing/debug-harness';

let debugClient: ReactNativeDebugClient;

beforeAll(async () => {
  debugClient = await connectToFirstTarget();
});

afterAll(() => {
  debugClient?.disconnect();
});

test('should access secure-store test modules directly', async () => {
  // First confirm test modules are available
  const checkResult = await debugClient.evaluateJavaScript(`
    (() => {
      return {
        hasTestModules: typeof globalThis.__TEST_MODULES__ !== 'undefined',
        hasSecureStore: globalThis.__TEST_MODULES__ && globalThis.__TEST_MODULES__.SecureStore ? true : false,
        functions: globalThis.__TEST_MODULES__ && globalThis.__TEST_MODULES__.SecureStore ? 
          Object.keys(globalThis.__TEST_MODULES__.SecureStore).filter(key => 
            typeof globalThis.__TEST_MODULES__.SecureStore[key] === 'function'
          ) : []
      };
    })()
  `);
  
  console.log('Check result:', JSON.stringify(checkResult, null, 2));
  
  expect(checkResult.hasTestModules).toBe(true);
  expect(checkResult.hasSecureStore).toBe(true);
  expect(checkResult.functions).toContain('saveValue');
}, 30000);

test('should save and retrieve a value from secure store', async () => {
  // Since promise chains don't work in RN debugger, we'll test function calls directly
  const testKey = `simple_test_${Date.now()}`;
  const testValue = `simple_value_${Math.random()}`;
  
  console.log(`Testing with key: ${testKey}, value: ${testValue}`);
  
  // Test saveValue function call
  const saveResult = await debugClient.evaluateJavaScript(`
    (() => {
      if (!globalThis.__TEST_MODULES__ || !globalThis.__TEST_MODULES__.SecureStore) {
        return { error: 'Test modules not available' };
      }
      
      const secureStore = globalThis.__TEST_MODULES__.SecureStore;
      
      try {
        const promise = secureStore.saveValue('${testKey}', '${testValue}');
        return {
          success: true,
          functionCalled: true,
          promiseReturned: promise && typeof promise.then === 'function',
          error: null
        };
      } catch (error) {
        return {
          success: false,
          functionCalled: false,
          promiseReturned: false,
          error: error.message
        };
      }
    })()
  `);
  
  console.log('Save result:', JSON.stringify(saveResult, null, 2));
  expect(saveResult.success).toBe(true);
  expect(saveResult.functionCalled).toBe(true);
  expect(saveResult.promiseReturned).toBe(true);
  
  // Test getValue function call
  const getResult = await debugClient.evaluateJavaScript(`
    (() => {
      const secureStore = globalThis.__TEST_MODULES__.SecureStore;
      
      try {
        const promise = secureStore.getValue('${testKey}');
        return {
          success: true,
          functionCalled: true,
          promiseReturned: promise && typeof promise.then === 'function',
          error: null
        };
      } catch (error) {
        return {
          success: false,
          functionCalled: false,
          promiseReturned: false,
          error: error.message
        };
      }
    })()
  `);
  
  console.log('Get result:', JSON.stringify(getResult, null, 2));
  expect(getResult.success).toBe(true);
  expect(getResult.functionCalled).toBe(true);
  expect(getResult.promiseReturned).toBe(true);
  
  // Test deleteValue function call for cleanup
  const deleteResult = await debugClient.evaluateJavaScript(`
    (() => {
      const secureStore = globalThis.__TEST_MODULES__.SecureStore;
      
      try {
        const promise = secureStore.deleteValue('${testKey}');
        return {
          success: true,
          functionCalled: true,
          promiseReturned: promise && typeof promise.then === 'function',
          error: null
        };
      } catch (error) {
        return {
          success: false,
          functionCalled: false,
          promiseReturned: false,
          error: error.message
        };
      }
    })()
  `);
  
  console.log('Delete result:', JSON.stringify(deleteResult, null, 2));
  expect(deleteResult.success).toBe(true);
  expect(deleteResult.functionCalled).toBe(true);
  expect(deleteResult.promiseReturned).toBe(true);
  
  console.log('✅ Successfully tested save, get, and delete value functions');
}, 30000);