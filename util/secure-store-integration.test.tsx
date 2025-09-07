// Comprehensive secure store integration tests - testing actual functionality on device
import { expect, test } from "@wallet-test/rn-test-harness/device";
import * as SecureStore from "./secure-store";

test("SecureStore module should be available with all functions", () => {
  expect(SecureStore).toBeDefined();
  expect(typeof SecureStore.saveValue).toBe("function");
  expect(typeof SecureStore.getValue).toBe("function");
  expect(typeof SecureStore.deleteValue).toBe("function");
  expect(typeof SecureStore.getAllKeys).toBe("function");
  expect(typeof SecureStore.clearAllSecureStorage).toBe("function");
  expect(typeof SecureStore.rebuildKeysList).toBe("function");
});

test("save and retrieve a value from SecureStore", async () => {
  const testKey = `test_save_retrieve_${Date.now()}_${Math.random()}`;
  const testValue = "Hello SecureStore!";

  // Save the value
  await SecureStore.saveValue(testKey, testValue);

  // Retrieve the value
  const retrievedValue = await SecureStore.getValue(testKey);

  // Verify it matches
  expect(retrievedValue).toBe(testValue);

  // Cleanup
  await SecureStore.deleteValue(testKey);
});

test("return null for non-existent keys", async () => {
  const nonExistentKey = `non_existent_${Date.now()}_${Math.random()}`;

  const result = await SecureStore.getValue(nonExistentKey);
  expect(result).toBeNull();
});

test("delete stored values", async () => {
  const testKey = `test_delete_${Date.now()}_${Math.random()}`;
  const testValue = "Value to be deleted";

  // Save a value
  await SecureStore.saveValue(testKey, testValue);

  // Verify it exists
  const beforeDelete = await SecureStore.getValue(testKey);
  expect(beforeDelete).toBe(testValue);

  // Delete it
  await SecureStore.deleteValue(testKey);

  // Verify it's gone
  const afterDelete = await SecureStore.getValue(testKey);
  expect(afterDelete).toBeNull();
});

test("overwrite existing values", async () => {
  const testKey = `test_overwrite_${Date.now()}_${Math.random()}`;
  const originalValue = "Original value";
  const newValue = "Updated value";

  // Save original value
  await SecureStore.saveValue(testKey, originalValue);
  const first = await SecureStore.getValue(testKey);
  expect(first).toBe(originalValue);

  // Overwrite with new value
  await SecureStore.saveValue(testKey, newValue);
  const second = await SecureStore.getValue(testKey);
  expect(second).toBe(newValue);

  // Cleanup
  await SecureStore.deleteValue(testKey);
});

test("store and retrieve JSON data", async () => {
  const testKey = `test_json_${Date.now()}_${Math.random()}`;
  const testObject = {
    name: "Test User",
    age: 30,
    preferences: ["dark_mode", "notifications"],
    metadata: { version: "1.0", timestamp: Date.now() },
  };
  const jsonString = JSON.stringify(testObject);

  // Save JSON string
  await SecureStore.saveValue(testKey, jsonString);

  // Retrieve and parse
  const retrieved = await SecureStore.getValue(testKey);
  expect(retrieved).toBe(jsonString);

  const parsedObject = JSON.parse(retrieved!);
  expect(parsedObject.name).toBe("Test User");
  expect(parsedObject.age).toBe(30);
  expect(parsedObject.preferences).toContain("dark_mode");

  // Cleanup
  await SecureStore.deleteValue(testKey);
});

test("handle empty string values", async () => {
  const testKey = `test_empty_${Date.now()}_${Math.random()}`;
  const emptyValue = "";

  await SecureStore.saveValue(testKey, emptyValue);
  const retrieved = await SecureStore.getValue(testKey);

  expect(retrieved).toBe(emptyValue);

  // Cleanup
  await SecureStore.deleteValue(testKey);
});

test("handle large string values", async () => {
  const testKey = `test_large_${Date.now()}_${Math.random()}`;
  const largeValue = "A".repeat(1000); // 1KB string

  await SecureStore.saveValue(testKey, largeValue);
  const retrieved = await SecureStore.getValue(testKey);

  expect(retrieved).toBe(largeValue);
  expect(retrieved!.length).toBe(1000);

  // Cleanup
  await SecureStore.deleteValue(testKey);
});

test("getAllKeys should return array of stored keys", async () => {
  const testKey1 = `test_keys_1_${Date.now()}_${Math.random()}`;
  const testKey2 = `test_keys_2_${Date.now()}_${Math.random()}`;

  // Save some test data
  await SecureStore.saveValue(testKey1, "value1");
  await SecureStore.saveValue(testKey2, "value2");

  // Get all keys
  const allKeys = await SecureStore.getAllKeys();

  expect(Array.isArray(allKeys)).toBe(true);
  expect(allKeys).toContain(testKey1);
  expect(allKeys).toContain(testKey2);

  // Cleanup
  await SecureStore.deleteValue(testKey1);
  await SecureStore.deleteValue(testKey2);
});

test("handle special characters in keys", async () => {
  const specialKeys = [
    `test_underscore_${Date.now()}`,
    `test-dash-${Date.now()}`,
    `test.dot.${Date.now()}`,
    `test123numbers${Date.now()}`,
  ];

  for (const key of specialKeys) {
    await SecureStore.saveValue(key, "test_value");
    const retrieved = await SecureStore.getValue(key);
    expect(retrieved).toBe("test_value");
    await SecureStore.deleteValue(key);
  }
});
