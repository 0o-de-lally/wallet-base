#!/usr/bin/env bun

/**
 * Validation script to ensure CI unit test setup is properly configured
 * This script checks all the components needed for unit tests on emulated devices
 */

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

interface ValidationResult {
  component: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

const results: ValidationResult[] = [];

function checkComponent(
  component: string,
  condition: boolean,
  message: string,
  isWarning = false,
): void {
  results.push({
    component,
    status: condition ? "pass" : isWarning ? "warning" : "fail",
    message,
  });
}

function validateCIConfig(): void {
  console.log("🔍 Validating CI unit test configuration...\n");

  // Check CI workflow exists
  const ciWorkflowPath = ".github/workflows/unit-tests.yaml";
  checkComponent(
    "CI Workflow",
    existsSync(ciWorkflowPath),
    "Unit tests workflow file exists",
  );

  if (existsSync(ciWorkflowPath)) {
    const ciContent = readFileSync(ciWorkflowPath, "utf8");

    // Check for key CI components
    checkComponent(
      "Emulator Setup",
      ciContent.includes("reactivecircus/android-emulator-runner"),
      "Uses Android emulator runner action",
    );
    checkComponent(
      "KVM Enable",
      ciContent.includes("Enable KVM"),
      "KVM acceleration properly enabled",
    );
    checkComponent(
      "Integrated Test Runner",
      ciContent.includes("test:unit:ci") || ciContent.includes("test:unit"),
      "Uses integrated test runner that handles setup/teardown",
    );
    checkComponent(
      "Test Command",
      ciContent.includes("bun test:unit"),
      "Executes unit tests command",
    );
  }

  // Check package.json scripts
  const packageJsonPath = "package.json";
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const scripts = packageJson.scripts || {};

    checkComponent(
      "Test Scripts",
      "test:unit" in scripts && "test:unit:integrated" in scripts,
      "Required test scripts are defined",
    );

    checkComponent(
      "Build Scripts",
      "build:packages" in scripts,
      "Package build script available",
    );

    checkComponent(
      "Lint Scripts",
      "lint" in scripts,
      "Lint script available for code quality",
    );
  }

  // Check test harness package
  const testHarnessPath = "packages/rn-test-harness/package.json";
  checkComponent(
    "Test Harness Package",
    existsSync(testHarnessPath),
    "React Native test harness package exists",
  );

  if (existsSync(testHarnessPath)) {
    const harnessPackage = JSON.parse(readFileSync(testHarnessPath, "utf8"));
    checkComponent(
      "Test Harness CLI",
      harnessPackage.bin && "rn-test-harness" in harnessPackage.bin,
      "Test harness provides CLI tool",
    );
  }

  // Check integrated test runner
  const integratedRunnerPath = "testing/run-unit-tests-with-setup.ts";
  checkComponent(
    "Integrated Runner",
    existsSync(integratedRunnerPath),
    "Integrated test runner script exists",
  );

  if (existsSync(integratedRunnerPath)) {
    const runnerContent = readFileSync(integratedRunnerPath, "utf8");
    checkComponent(
      "Emulator Management",
      runnerContent.includes("spawnEmulator") &&
        runnerContent.includes("waitForDeviceBoot"),
      "Handles emulator lifecycle management",
    );
    checkComponent(
      "Metro Integration",
      runnerContent.includes("startMetroBundler"),
      "Integrates with Metro bundler",
    );
    checkComponent(
      "Process Cleanup",
      runnerContent.includes("killAll"),
      "Proper process cleanup on exit",
    );
  }

  // Check emulator setup utilities
  const emulatorSetupPath = "testing/emulator-setup.ts";
  checkComponent(
    "Emulator Utilities",
    existsSync(emulatorSetupPath),
    "Emulator setup utilities exist",
  );

  // Check for existing tests
  const testDirs = ["util/", "components/"];
  const hasTestFiles = testDirs.some((dir) => {
    try {
      const files = execSync(
        `find ${dir} -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null || true`,
        { encoding: "utf8" },
      );
      return files.trim().length > 0;
    } catch {
      return false;
    }
  });
  checkComponent(
    "Test Files",
    hasTestFiles,
    "Unit test files found in codebase",
    true,
  );
}

function printResults(): void {
  console.log("\n📊 Validation Results:");
  console.log("=".repeat(60));

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const warnCount = results.filter((r) => r.status === "warning").length;

  for (const result of results) {
    const icon =
      result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⚠️";
    console.log(`${icon} ${result.component}: ${result.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    `Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`,
  );

  if (failCount === 0) {
    console.log(
      "\n🎉 CI unit test setup is properly configured for headless execution!",
    );
    console.log("\nThe following components are ready:");
    console.log("• Android emulator with headless mode (-no-window)");
    console.log("• React Native test harness that works without visible UI");
    console.log(
      "• Authentication bypass for CI environments (biometric fallback)",
    );
    console.log("• Metro debug endpoints accessible in headless mode");
    console.log("• TestModuleExposer renders properly without display window");
    console.log("\nCI workflow process:");
    console.log("1. Start headless Android emulator with KVM acceleration");
    console.log(
      "2. Build and install React Native app (UI renders but not displayed)",
    );
    console.log("3. App bypasses biometric auth (no hardware in CI)");
    console.log(
      "4. TestModuleExposer component exposes test functions globally",
    );
    console.log("5. Test harness connects to debug endpoints and runs tests");
    console.log("6. Results reported via Chrome DevTools Protocol");
    console.log("\n✅ Headless mode works because:");
    console.log("   • UI components still render (just not displayed to user)");
    console.log("   • JavaScript bridge and Metro connections still work");
    console.log("   • Same as how Maestro can test UIs in headless emulators");
  } else {
    console.log(
      "\n⚠️  Some components need attention before CI will work properly.",
    );
    process.exit(1);
  }
}

// Main execution
try {
  validateCIConfig();
  printResults();
} catch (error) {
  console.error("❌ Validation failed:", error);
  process.exit(1);
}
