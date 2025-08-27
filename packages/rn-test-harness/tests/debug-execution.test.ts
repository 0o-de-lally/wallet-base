import { test, expect, beforeAll, afterAll } from "bun:test";
import {
  ReactNativeDebugClient,
  connectToFirstTarget,
} from "../src/debug-client";

// Test suite
let debugClient: ReactNativeDebugClient;

beforeAll(async () => {
  // Use the helper function to connect to the first target
  debugClient = await connectToFirstTarget();
});

afterAll(() => {
  debugClient?.disconnect();
});

test("should connect to React Native debug target", async () => {
  // Test that we're connected by checking the connection status
  expect(debugClient.isConnectedToTarget()).toBe(true);

  // Get targets to verify the connection was successful
  const targets = await debugClient.getAvailableTargets();
  expect(targets).toBeInstanceOf(Array);
  expect(targets.length).toBeGreaterThan(0);

  const target = targets[0];
  expect(target).toHaveProperty("id");
  expect(target).toHaveProperty("webSocketDebuggerUrl");
  expect(target.webSocketDebuggerUrl).toMatch(
    /^ws:\/\/localhost:8081\/inspector\/debug/,
  );
});

test("should execute basic arithmetic JavaScript", async () => {
  const result = await debugClient.evaluateJavaScript("2 + 2");
  expect(result).toBe(4);
});

test("should execute string operations", async () => {
  const result = await debugClient.evaluateJavaScript(
    '"Hello" + " " + "World"',
  );
  expect(result).toBe("Hello World");
});

test("should access global JavaScript objects", async () => {
  const result = await debugClient.evaluateJavaScript("typeof globalThis");
  expect(result).toBe("object");
});

test("should detect React Native environment", async () => {
  const result = await debugClient.evaluateJavaScript("typeof __DEV__");
  expect(result).toBe("boolean");
});

test("should execute complex JavaScript with variables", async () => {
  const result = await debugClient.evaluateJavaScript(`
    const numbers = [1, 2, 3, 4, 5];
    numbers.reduce((sum, num) => sum + num, 0);
  `);
  expect(result).toBe(15);
});

test("should execute JavaScript with JSON operations", async () => {
  const result = await debugClient.evaluateJavaScript(`
    const obj = { name: 'test', value: 42 };
    JSON.stringify(obj);
  `);
  expect(result).toBe('{"name":"test","value":42}');
});

test("should handle JavaScript errors gracefully", async () => {
  expect(async () => {
    await debugClient.evaluateJavaScript('throw new Error("Test error")');
  }).toThrow();
});

test("should handle Date and time operations", async () => {
  // Test Date operations which are synchronous but demonstrate time-related functionality
  const result = await debugClient.evaluateJavaScript(`
    new Date().getFullYear() > 2020;
  `);
  expect(result).toBe(true);
});

test("should access React Native specific globals", async () => {
  // Test for React Native Bridge using globalThis instead of global
  const bridgeExists = await debugClient.evaluateJavaScript(
    'typeof globalThis.nativeFabricUIManager !== "undefined" || typeof globalThis.__fbBatchedBridge !== "undefined"',
  );
  expect(bridgeExists).toBe(true);
});

test("should execute function definitions and calls", async () => {
  const result = await debugClient.evaluateJavaScript(`
    function multiply(a, b) {
      return a * b;
    }
    multiply(6, 7);
  `);
  expect(result).toBe(42);
});
