import { spawn, spawnSync, ChildProcess } from "child_process";

import { secureError } from "../util/error-utils";
import {
  waitForDeviceBoot,
  checkEmulatorAvailable,
  spawnEmulator,
  waitForAppInstallation,
  findInstalledAppPackages,
} from "./emulator-setup";

let emulatorProc: ChildProcess | undefined;
let expoProc: ChildProcess | undefined;
let maestroProc: ChildProcess | undefined;

function killAll() {
  if (maestroProc && !maestroProc.killed) maestroProc.kill();
  if (expoProc && !expoProc.killed) expoProc.kill();
  if (emulatorProc && !emulatorProc.killed) emulatorProc.kill();
}

process.on("SIGINT", () => {
  killAll();
  process.exit(1);
});
process.on("exit", killAll);

async function spawnExpoAndroid() {
  return new Promise<void>((resolve, reject) => {
    // Use bun script for all environments
    expoProc = spawn("bun", ["android"], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    let isResolved = false;

    expoProc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stdout.write(text); // Forward all output to stdout
      if (text.includes("Android Bundled") && !isResolved) {
        isResolved = true;
        resolve();
      }
    });

    expoProc.on("exit", (code: number | null) => {
      if (!isResolved) {
        if (code !== 0 && code !== null) {
          reject(new Error(`Expo failed with code ${code}`));
        } else {
          resolve();
        }
      }
    });
  });
}

function spawnMaestroTest() {
  return new Promise<void>((resolve, reject) => {
    maestroProc = spawn("maestro", ["test", "./maestro"], { stdio: "inherit" });
    maestroProc.on("exit", (code: number | null) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Maestro test failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log("🚀 Starting E2E test harness...");
  
  // First check if there's already a device/emulator running (common in CI)
  console.log("🔍 Checking for existing devices...");
  const existingDevices = spawnSync("adb", ["devices"], { encoding: "utf8" });
  console.log(`📱 Current adb devices:\n${existingDevices.stdout}`);
  
  const hasRunningDevice = existingDevices.stdout && 
    existingDevices.stdout.includes("device") && 
    !existingDevices.stdout.includes("offline");
    
  if (hasRunningDevice) {
    console.log("✅ Found existing device/emulator, proceeding to boot verification...");
    await waitForDeviceBoot();
  } else {
    console.log("ℹ️  No existing device found, checking emulator availability...");
    if (!checkEmulatorAvailable()) {
      process.exit(1);
    }

    try {
      // Start the emulator
      console.log("🚀 Starting new emulator...");
      emulatorProc = spawnEmulator();
      await waitForDeviceBoot();
    } catch (error) {
      console.error("❌ Failed to start emulator:", error);
      throw error;
    }
  }
  
  try {

    // Build and install the Android app
    console.log("Building and installing Android app...");
    await spawnExpoAndroid();

    // First, let's see what packages are actually installed
    console.log("\n🔍 Checking what packages are installed...");
    const installedPackages = findInstalledAppPackages();

    if (installedPackages.length === 0) {
      console.log(
        "⚠️  No relevant packages found. Waiting for installation...",
      );
      // Wait for app to be properly installed on device (5 minute timeout)
      await waitForAppInstallation("app.carpe.wallet_base", 300000);
    } else {
      console.log(
        `✅ Found ${installedPackages.length} relevant packages - app appears to be installed!`,
      );
    }

    // Run the tests
    await spawnMaestroTest();
  } catch (err) {
    killAll();
    secureError(err);
    process.exit(1);
  }
  killAll();
  process.exit(0);
}

main().catch((err) => {
  secureError(err);
  process.exit(1);
});
