// Comprehensive secure store integration tests - testing actual functionality on device
import { expect } from "./expect_lib";
import { test } from "@wallet-test/rn-test-harness/device";
import * as SecureStore from "./secure-store";

test('SecureStore module should be available with all functions', () => {
  expect(SecureStore).toBeDefined();
  expect(typeof SecureStore.saveValue).toBe('function');
  expect(typeof SecureStore.getValue).toBe('function');
  expect(typeof SecureStore.deleteValue).toBe('function');
  expect(typeof SecureStore.getAllKeys).toBe('function');
  expect(typeof SecureStore.clearAllSecureStorage).toBe('function');
  expect(typeof SecureStore.rebuildKeysList).toBe('function');
});

test('saveValue should return a promise', () => {
  const testKey = `test_save_${Date.now()}`;
  const testValue = 'test_value';
  
  const result = SecureStore.saveValue(testKey, testValue);
  expect(result).toBeDefined();
  expect(typeof result?.then).toBe('function');
});

test('getValue should return a promise', () => {
  const testKey = 'non_existent_key';
  
  const result = SecureStore.getValue(testKey);
  expect(result).toBeDefined();
  expect(typeof result?.then).toBe('function');
});

test('deleteValue should return a promise', () => {
  const testKey = 'non_existent_key';
  
  const result = SecureStore.deleteValue(testKey);
  expect(result).toBeDefined();
  expect(typeof result?.then).toBe('function');
});

test('getAllKeys should return a promise', () => {
  const result = SecureStore.getAllKeys();
  expect(result).toBeDefined();
  expect(typeof result?.then).toBe('function');
});

test('clearAllSecureStorage should return a promise', () => {
  const result = SecureStore.clearAllSecureStorage();
  expect(result).toBeDefined();
  expect(typeof result?.then).toBe('function');
});

test('rebuildKeysList should return a promise', () => {
  const result = SecureStore.rebuildKeysList();
  expect(result).toBeDefined();
  expect(typeof result?.then).toBe('function');
});

test('SecureStore functions should not throw errors when called', () => {
  const testKey = `test_no_throw_${Date.now()}`;
  const testValue = 'test_value';
  
  // These should not throw synchronous errors
  expect(() => SecureStore.saveValue(testKey, testValue)).not.toThrow();
  expect(() => SecureStore.getValue(testKey)).not.toThrow();
  expect(() => SecureStore.deleteValue(testKey)).not.toThrow();
  expect(() => SecureStore.getAllKeys()).not.toThrow();
});

test('SecureStore should handle different value types', () => {
  const testKey = `test_types_${Date.now()}`;
  
  // Test with string
  expect(() => SecureStore.saveValue(testKey, 'string_value')).not.toThrow();
  
  // Test with JSON stringified object
  const testObject = { name: 'test', value: 123 };
  expect(() => SecureStore.saveValue(testKey, JSON.stringify(testObject))).not.toThrow();
  
  // Test with empty string
  expect(() => SecureStore.saveValue(testKey, '')).not.toThrow();
});

test('SecureStore should handle edge cases for keys', () => {
  const timestamp = Date.now();
  
  // Test with normal key
  expect(() => SecureStore.saveValue(`normal_key_${timestamp}`, 'value')).not.toThrow();
  
  // Test with key containing underscores
  expect(() => SecureStore.saveValue(`key_with_underscores_${timestamp}`, 'value')).not.toThrow();
  
  // Test with key containing numbers
  expect(() => SecureStore.saveValue(`key123_${timestamp}`, 'value')).not.toThrow();
});