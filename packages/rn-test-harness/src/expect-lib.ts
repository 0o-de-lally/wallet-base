/**
 * Custom expect library based on bun:test expect API
 * Provides Jest-compatible assertion methods for runtime testing
 * Throws errors on assertion failure like bun:test and Jest
 */

type Matchers = {
  // Equality matchers
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toStrictEqual(expected: any): void;

  // Type and existence matchers
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeInstanceOf(constructor: any): void;
  toBeNaN(): void;

  // Comparison matchers
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, precision?: number): void;

  // Collection matchers
  toContain(item: any): void;
  toContainEqual(item: any): void;
  toHaveLength(expected: number): void;
  toHaveProperty(keyPath: string, value?: any): void;

  // String/Pattern matchers
  toMatch(expected: string | RegExp): void;

  // Function/Error matchers
  toThrow(expected?: string | RegExp | Error): void;

  // Modifier
  not: Matchers;
};

// Deep equality comparison
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

// Get property by path
function getProperty(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Create matcher implementation
function createMatchers(actual: any, isNot: boolean = false): Matchers {
  const matchers: Matchers = {} as Matchers;

  // Define matchers without circular references
  Object.assign(matchers, {
    toBe: (expected: any) => {
      const pass = Object.is(actual, expected);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be ${expected}`,
        );
      }
    },

    toEqual: (expected: any) => {
      const pass = deepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${isNot ? "not " : ""}to equal ${JSON.stringify(expected)}`,
        );
      }
    },

    toStrictEqual: (expected: any) => {
      const pass = deepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${isNot ? "not " : ""}to strictly equal ${JSON.stringify(expected)}`,
        );
      }
    },

    toBeTruthy: () => {
      const pass = Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be truthy`,
        );
      }
    },

    toBeFalsy: () => {
      const pass = !Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? "not " : ""}to be falsy`);
      }
    },

    toBeNull: () => {
      const pass = actual === null;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? "not " : ""}to be null`);
      }
    },

    toBeUndefined: () => {
      const pass = actual === undefined;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be undefined`,
        );
      }
    },

    toBeDefined: () => {
      const pass = actual !== undefined;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be defined`,
        );
      }
    },

    toBeInstanceOf: (constructor: any) => {
      const pass = actual instanceof constructor;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be instance of ${constructor.name}`,
        );
      }
    },

    toBeNaN: () => {
      const pass = Number.isNaN(actual);
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? "not " : ""}to be NaN`);
      }
    },

    toBeGreaterThan: (expected: number) => {
      const pass = actual > expected;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be greater than ${expected}`,
        );
      }
    },

    toBeLessThan: (expected: number) => {
      const pass = actual < expected;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be less than ${expected}`,
        );
      }
    },

    toBeGreaterThanOrEqual: (expected: number) => {
      const pass = actual >= expected;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be greater than or equal to ${expected}`,
        );
      }
    },

    toBeLessThanOrEqual: (expected: number) => {
      const pass = actual <= expected;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be less than or equal to ${expected}`,
        );
      }
    },

    toBeCloseTo: (expected: number, precision: number = 2) => {
      const diff = Math.abs(actual - expected);
      const pass = diff < Math.pow(10, -precision);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to be close to ${expected}`,
        );
      }
    },

    toContain: (item: any) => {
      const pass = Array.isArray(actual)
        ? actual.includes(item)
        : actual.indexOf(item) !== -1;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to contain ${item}`,
        );
      }
    },

    toContainEqual: (item: any) => {
      const pass = Array.isArray(actual)
        ? actual.some((el) => deepEqual(el, item))
        : false;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${isNot ? "not " : ""}to contain equal ${JSON.stringify(item)}`,
        );
      }
    },

    toHaveLength: (expected: number) => {
      const pass = actual.length === expected;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to have length ${expected}`,
        );
      }
    },

    toHaveProperty: (keyPath: string, value?: any) => {
      const hasProperty = getProperty(actual, keyPath) !== undefined;
      const hasCorrectValue =
        value === undefined || deepEqual(getProperty(actual, keyPath), value);
      const pass = hasProperty && hasCorrectValue;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${isNot ? "not " : ""}to have property ${keyPath}${value !== undefined ? ` with value ${JSON.stringify(value)}` : ""}`,
        );
      }
    },

    toMatch: (expected: string | RegExp) => {
      const pass =
        typeof expected === "string"
          ? actual.includes(expected)
          : expected.test(actual);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${isNot ? "not " : ""}to match ${expected}`,
        );
      }
    },

    toThrow: (expected?: string | RegExp | Error) => {
      let pass = false;
      let thrownError: any;

      try {
        if (typeof actual === "function") {
          actual();
        } else {
          throw new Error("Expected a function");
        }
      } catch (error: unknown) {
        thrownError = error;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!expected) {
          pass = true;
        } else if (typeof expected === "string") {
          pass = errorMessage.includes(expected);
        } else if (expected instanceof RegExp) {
          pass = expected.test(errorMessage);
        } else if (expected instanceof Error) {
          pass = errorMessage === expected.message;
        }
      }

      if (isNot ? pass : !pass) {
        if (!thrownError) {
          throw new Error(
            `Expected function ${isNot ? "not " : ""}to throw${expected ? ` ${expected}` : ""}`,
          );
        }
        const errorMessage =
          thrownError instanceof Error
            ? thrownError.message
            : String(thrownError);
        throw new Error(
          `Expected function ${isNot ? "not " : ""}to throw${expected ? ` ${expected}` : ""}, but it threw: ${errorMessage}`,
        );
      }
    },
  });

  // Add .not property after matchers are defined to avoid circular references
  Object.defineProperty(matchers, "not", {
    get() {
      return createMatchers(actual, !isNot);
    },
    enumerable: false,
    configurable: true,
  });

  return matchers;
}

// Main expect function
export function expect(actual: any): Matchers {
  return createMatchers(actual);
}

// Helper function to assert (throws on failure)
export function assert(
  condition: boolean,
  message: string = "Assertion failed",
): void {
  if (!condition) {
    throw new Error(message);
  }
}
