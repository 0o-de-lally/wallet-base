// Basic test examples
import { expect, test } from "@wallet-test/rn-test-harness/device";

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

test('array contains should work', () => {
  expect([1, 2, 3]).toContain(2);
  expect("hello world").toMatch(/world/);
});

test('should handle null and undefined', () => {
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();
  expect("defined").toBeDefined();
});

test('should handle NaN values', () => {
  expect(NaN).toBeNaN();
  expect(42).not.toBeNaN();
});
