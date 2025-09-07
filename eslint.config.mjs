import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default defineConfig([
  {
    ignores: [
      "metro.config.js", 
      "**/dist/**",
      "**/node_modules/**",
      ".expo/**"
    ]
  },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      // Forbid console usage except in error-utils.ts for secure logging
      "no-console": "error"
    }
  },
  {
    // Allow console usage in utilities, CLI, and device test files
    files: [
      "util/error-utils.ts", 
      "testing/*", 
      "packages/rn-test-harness/src/cli.ts",
      "packages/rn-test-harness/src/device-test-utils.ts",
      "packages/rn-test-harness/src/test-harness.ts",
      "packages/rn-test-harness/src/TestModuleExposer.tsx",
      "packages/rn-test-harness/src/debug-client.ts"
    ],
    rules: {
      "no-console": "off"
    }
  },
  {
    // Allow any types in expect library and debug harness as they handle arbitrary values
    files: [
      "packages/rn-test-harness/src/expect-lib.ts",
      "packages/rn-test-harness/src/test-harness.ts",
      "packages/rn-test-harness/src/device-test-utils.ts",
      "packages/rn-test-harness/src/TestModuleExposer.tsx",
      "packages/rn-test-harness/src/debug-client.ts",
      "testing/debug-harness.ts"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-extra-boolean-cast": "off",
      "@typescript-eslint/ban-ts-comment": "off"
    }
  }
]);
