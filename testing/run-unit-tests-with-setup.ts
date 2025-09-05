#!/usr/bin/env bun

/**
 * Integrated unit test runner that starts emulator, Metro, and runs tests
 * This script ensures all required services are running before executing unit tests
 */

import { spawn, ChildProcess } from "child_process";
import { secureError } from "../util/error-utils";
import {
  waitForDeviceBoot,
  checkEmulatorAvailable,
  spawnEmulator,
  waitForAppInstallation,
} from "./emulator-setup";

let emulatorProc: ChildProcess | undefined;
let metroProc: ChildProcess | undefined;
let testProc: ChildProcess | undefined;

function killAll() {
  console.log("🧹 Cleaning up processes...");
  if (testProc && !testProc.killed) {
    testProc.kill();
    console.log("   ✓ Test process terminated");
  }
  if (metroProc && !metroProc.killed) {
    metroProc.kill();
    console.log("   ✓ Metro bundler terminated");
  }
  if (emulatorProc && !emulatorProc.killed) {
    emulatorProc.kill();
    console.log("   ✓ Emulator terminated");
  }
}

process.on("SIGINT", () => {
  killAll();
  process.exit(1);
});
process.on("exit", killAll);

// Unused function - keeping for potential future use
/*
async function startMetroBundler(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log("🚀 Starting Metro bundler...");
    
    metroProc = spawn("bun", ["start"], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    let isResolved = false;

    metroProc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      
      // Look for Metro ready indicators
      if ((text.includes("Metro waiting on") || 
           text.includes("Welcome to Metro") ||
           text.includes("To reload the app")) && !isResolved) {
        isResolved = true;
        console.log("   ✓ Metro bundler ready");
        resolve();
      }
    });

    // Fallback timeout for Metro startup
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.log("   ⚠️  Metro startup timeout, continuing...");
        resolve();
      }
    }, 30000); // 30 second timeout

    metroProc.on("exit", (code: number | null) => {
      if (!isResolved && code !== 0) {
        reject(new Error(`Metro bundler failed with code ${code}`));
      }
    });
  });
}
*/

async function buildAndInstallApp(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log("📱 Building and installing React Native app...");

    const buildProc = spawn("bun", ["android"], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    let isResolved = false;

    buildProc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("Android Bundled") && !isResolved) {
        isResolved = true;
        console.log("   ✓ App built and installed");
        resolve();
      }
    });

    buildProc.on("exit", (code: number | null) => {
      if (!isResolved) {
        if (code !== 0 && code !== null) {
          reject(new Error(`App build failed with code ${code}`));
        } else {
          console.log("   ✓ App build completed");
          resolve();
        }
      }
    });

    // Timeout for app build
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.log("   ⚠️  App build timeout, continuing...");
        resolve();
      }
    }, 120000); // 2 minute timeout
  });
}

async function runUnitTests(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    console.log("🧪 Running unit tests...");

    const testCommand = process.argv.includes("--custom")
      ? "test:unit:custom"
      : "test:unit";
    testProc = spawn("bun", ["run", testCommand], {
      stdio: "inherit",
    });

    testProc.on("exit", (code: number | null) => {
      const success = code === 0;
      if (success) {
        console.log("   ✅ All unit tests passed!");
      } else {
        console.log("   ❌ Some unit tests failed");
      }
      resolve(success);
    });
  });
}

async function waitForServices(): Promise<void> {
  console.log("⏳ Waiting for services to be ready...");

  // Give Metro and the app time to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Check if app is installed
  try {
    await waitForAppInstallation("app.carpe.wallet_base", 30000);
    console.log("   ✓ App verified on device");

    // Launch the app to ensure it's running and exposes debug endpoints
    console.log("🚀 Launching app to activate debug endpoints...");
    spawn(
      "adb",
      ["shell", "am", "start", "-n", "app.carpe.wallet_base/.MainActivity"],
      {
        stdio: "inherit",
      },
    );

    // Give the app time to start and expose debug endpoints
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("   ✓ App launched and warming up");

    // Check if debug endpoints are now available
    console.log("🔍 Checking for debug endpoints...");
    try {
      const response = await fetch("http://localhost:8081/json/list");
      const data = await response.text();
      console.log("   ✓ Debug endpoints response:", data.substring(0, 100));
    } catch (error) {
      console.log(
        "   ⚠️  Debug endpoints not yet available:",
        (error as Error).message,
      );
    }
  } catch {
    console.log("   ⚠️  App verification timeout, continuing...");
  }
}

async function main() {
  console.log("🔧 Integrated Unit Test Runner");
  console.log("=".repeat(50));

  try {
    // Check emulator availability
    console.log("🔍 Checking emulator availability...");
    if (!checkEmulatorAvailable()) {
      console.error("❌ No emulator available");
      process.exit(1);
    }
    console.log("   ✓ Emulator available");

    // Start emulator (using existing Maestro-created AVD)
    console.log("📱 Starting Android emulator...");
    emulatorProc = spawnEmulator();

    // Wait for device to be fully ready
    await waitForDeviceBoot();
    console.log("   ✓ Emulator booted and ready");

    // Build and install app (this will start Metro automatically)
    await buildAndInstallApp();

    // Wait for everything to be ready
    await waitForServices();

    // Run the unit tests
    const testsPassed = await runUnitTests();

    // Clean up and exit
    killAll();

    if (testsPassed) {
      console.log("\n🎉 Unit tests completed successfully!");
      process.exit(0);
    } else {
      console.log("\n💥 Unit tests failed!");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test runner failed:");
    secureError(error);
    killAll();
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Integrated Unit Test Runner

Usage: bun run test:unit:integrated [options]

Options:
  --custom    Run custom unit tests instead of standard tests
  --help, -h  Show this help message

This script will:
1. Start Android emulator
2. Start Metro bundler  
3. Build and install the React Native app
4. Wait for services to be ready
5. Run unit tests
6. Clean up all processes

The script handles process cleanup automatically on exit or interruption.
`);
  process.exit(0);
}

main().catch((error) => {
  console.error("\n💥 Unexpected error:");
  secureError(error);
  killAll();
  process.exit(1);
});
