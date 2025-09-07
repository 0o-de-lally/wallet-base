import { spawn, spawnSync, ChildProcess } from "child_process";

export async function waitForDeviceBoot() {
  console.log("🔍 Waiting for device to be recognized...");

  // Wait until device is recognized (with timeout)
  let deviceFound = false;
  for (let i = 0; i < 60; i++) {
    // 60 second timeout
    const result = spawnSync("adb", ["devices"], { encoding: "utf8" });
    
    // Log detailed adb devices output for debugging
    if (i % 10 === 0 || i < 5) {  // Log every 10 seconds or first 5 attempts
      console.log(`📱 Attempt ${i + 1}/60: adb devices output:`);
      console.log(result.stdout || "(no stdout)");
      if (result.stderr) console.log(`stderr: ${result.stderr}`);
    }
    
    if (
      result.stdout &&
      result.stdout.includes("device") &&
      !result.stdout.includes("offline")
    ) {
      deviceFound = true;
      console.log("✅ Device found in adb devices");
      break;
    }
    await new Promise((res) => setTimeout(res, 1000));
  }

  if (!deviceFound) {
    throw new Error("❌ Device not found in adb devices after 60 seconds");
  }

  console.log("⏳ Waiting for device boot to complete...");
  
  // First check if device is already booted
  const initialBootCheck = spawnSync(
    "adb",
    ["shell", "getprop", "sys.boot_completed"],
    { encoding: "utf8" },
  );
  console.log(`🔍 Initial boot status: "${initialBootCheck.stdout?.trim()}" (should be "1" when ready)`);
  
  // Poll for sys.boot_completed with timeout - reduced from 15 to 10 minutes
  for (let i = 0; i < 600; i++) {
    // 10 minute timeout for boot
    const result = spawnSync(
      "adb",
      ["shell", "getprop", "sys.boot_completed"],
      { encoding: "utf8" },
    );
    
    const bootStatus = result.stdout?.toString().trim();
    
    // Log progress every 30 seconds or if there's an error
    if (i % 30 === 0 || result.error) {
      console.log(`⏱️  Boot check ${i + 1}/600 (${Math.round((i + 1) / 10)}min): status="${bootStatus}"`);
      if (result.error) {
        console.log(`⚠️  Error checking boot status: ${result.error.message}`);
      }
    }
    
    if (bootStatus === "1") {
      console.log("✅ Device boot completed successfully!");
      
      // Additional verification - check if package manager is ready
      console.log("🔍 Verifying package manager is ready...");
      const pmResult = spawnSync("adb", ["shell", "pm", "path", "android"], { 
        encoding: "utf8", 
        timeout: 5000 
      });
      
      if (pmResult.stdout && pmResult.stdout.includes("package:")) {
        console.log("✅ Package manager is ready");
        return;
      } else {
        console.log("⚠️  Package manager not ready yet, continuing boot wait...");
      }
    }
    await new Promise((res) => setTimeout(res, 1000));
  }

  // Enhanced error message with more diagnostics
  console.log("❌ Boot timeout reached. Collecting diagnostics...");
  
  // Final diagnostic checks
  const finalAdbDevices = spawnSync("adb", ["devices"], { encoding: "utf8" });
  console.log("Final adb devices:", finalAdbDevices.stdout);
  
  const finalBootStatus = spawnSync("adb", ["shell", "getprop", "sys.boot_completed"], { encoding: "utf8" });
  console.log("Final boot status:", finalBootStatus.stdout?.trim());
  
  const uilockStatus = spawnSync("adb", ["shell", "getprop", "service.bootanim.exit"], { encoding: "utf8" });
  console.log("UI unlock status:", uilockStatus.stdout?.trim());

  throw new Error("❌ Device boot did not complete within 10 minutes");
}

function checkSystemImagesAvailable(): boolean {
  try {
    const result = spawnSync(
      "/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager",
      ["--list"],
      { encoding: "utf8" },
    );
    if (result.error) {
      console.error("SDK Manager not found or failed");
      return false;
    }

    // Check if Android 30 system image is installed
    const hasAndroid30 = result.stdout.includes(
      "system-images;android-30;google_apis;x86_64",
    );

    if (hasAndroid30) {
      console.log("Android 30 system image found");
      return true;
    }

    console.log("No suitable system images found");
    return false;
  } catch (error) {
    console.error("Failed to check system images:", error);
    return false;
  }
}

export function checkEmulatorAvailable(): boolean {
  try {
    console.log("🔍 Checking emulator command availability...");
    const result = spawnSync("emulator", ["-list-avds"], { encoding: "utf8" });
    if (result.error) {
      console.error(
        "❌ Emulator command not found. Make sure Android SDK is installed and emulator is in PATH.",
      );
      return false;
    }

    const output = result.stdout.trim();
    console.log(`📱 Raw emulator output: "${output}"`);
    
    // Handle case where emulator command returns status messages instead of AVD list
    if (
      output.includes("Android Virtual Device Manager") ||
      output.includes("Emulator started")
    ) {
      console.log("✅ Emulator command available");
      // Check if system images are available before proceeding
      return checkSystemImagesAvailable();
    }

    if (!output) {
      console.log("⚠️  No existing AVDs found - checking system images");
      return checkSystemImagesAvailable();
    }

    const avdList = output.split("\n").filter(line => line.trim());
    console.log(`✅ Found ${avdList.length} existing AVDs: ${avdList.join(", ")}`);
    
    // Store the first available AVD for later use
    if (avdList.length > 0) {
      process.env.DETECTED_AVD_NAME = avdList[0];
      console.log(`📝 Will use AVD: ${avdList[0]}`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Failed to check emulator availability:", error);
    return false;
  }
}

function checkRunningEmulators(): boolean {
  try {
    console.log("🔍 Checking for running emulators...");
    const result = spawnSync("adb", ["devices"], { encoding: "utf8" });
    if (result.error) {
      console.error(
        "❌ ADB command not found. Make sure Android SDK is installed and adb is in PATH.",
      );
      return false;
    }

    console.log(`📱 ADB devices output:\n${result.stdout}`);
    
    const devices = result.stdout.trim().split("\n").slice(1); // Skip header line
    const runningEmulators = devices.filter(
      (line) => line.includes("emulator-") && line.includes("device"),
    );
    
    // Also check for any device that's not offline/unauthorized
    const anyRunningDevices = devices.filter(
      (line) => line.includes("device") && !line.includes("offline") && !line.includes("unauthorized")
    );

    if (runningEmulators.length > 0) {
      console.log(`✅ Found ${runningEmulators.length} running emulator(s):`);
      runningEmulators.forEach((device) => console.log(`  📱 ${device}`));
      return true;
    } else if (anyRunningDevices.length > 0) {
      console.log(`✅ Found ${anyRunningDevices.length} running device(s) (may not be emulators):`);
      anyRunningDevices.forEach((device) => console.log(`  📱 ${device}`));
      return true;
    }

    console.log("ℹ️  No running emulators found");
    return false;
  } catch (error) {
    console.error("❌ Failed to check running emulators:", error);
    return false;
  }
}

export function spawnEmulator(): ChildProcess | undefined {
  // Check if emulator is already running
  if (checkRunningEmulators()) {
    console.log("✅ Emulator already running, skipping startup...");
    return;
  }

  // Determine which AVD to use
  const detectedAvd = process.env.DETECTED_AVD_NAME;
  const avdName = detectedAvd || "test"; // Fallback to "test" which was shown in the error
  
  console.log(`🚀 Starting emulator with AVD: ${avdName}`);
  console.log("📋 Emulator configuration:");
  console.log("  - No window (headless)");
  console.log("  - No audio");  
  console.log("  - No boot animation");
  console.log("  - GPU: swiftshader_indirect");
  console.log("  - Memory: 2048MB");

  const emulatorArgs = [
    "-avd",
    avdName,
    "-no-window",
    "-no-audio", 
    "-no-boot-anim",
    "-gpu",
    "swiftshader_indirect",
    "-memory",
    "2048",
  ];

  console.log(`🔧 Full emulator command: emulator ${emulatorArgs.join(" ")}`);
  
  const emulatorProc = spawn("emulator", emulatorArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false, // Keep attached so we can monitor it
  });

  // Log emulator output for debugging
  emulatorProc.stdout?.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`📱 Emulator stdout: ${output}`);
    }
  });

  emulatorProc.stderr?.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
      // Log all stderr output, but mark audio warnings differently
      if (output.includes("pulseaudio") || output.includes("audio")) {
        console.log(`🔊 Emulator audio warning: ${output}`);
      } else if (output.includes("ERROR") || output.includes("FAIL")) {
        console.log(`❌ Emulator error: ${output}`);
      } else {
        console.log(`⚠️  Emulator stderr: ${output}`);
      }
    }
  });
  
  emulatorProc.on("exit", (code) => {
    console.log(`📱 Emulator process exited with code: ${code}`);
  });
  
  emulatorProc.on("error", (error) => {
    console.log(`❌ Emulator process error: ${error.message}`);
  });

  return emulatorProc;
}

export function findInstalledAppPackages(): string[] {
  try {
    const result = spawnSync("adb", ["shell", "pm", "list", "packages"], {
      encoding: "utf8",
      timeout: 10000,
    });

    if (result.stdout) {
      const allPackages = result.stdout.split("\n").filter((pkg) => pkg.trim());
      const relevantPackages = allPackages.filter(
        (pkg) =>
          pkg.includes("carpe") ||
          pkg.includes("wallet") ||
          pkg.includes("expo") ||
          pkg.includes("host.exp"),
      );

      console.log(`📦 All relevant packages found:`);
      relevantPackages.forEach((pkg) => console.log(`  ${pkg}`));

      return relevantPackages;
    }
  } catch (error) {
    console.log(`⚠️  Error finding packages:`, error);
  }

  return [];
}

export async function waitForAppInstallation(
  packageName: string,
  maxWaitTime: number = 60000,
): Promise<void> {
  console.log(`Waiting for app installation: ${packageName}`);
  let attemptCount = 0;

  // Create a timeout promise that rejects after maxWaitTime
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Timeout: App ${packageName} was not installed within ${maxWaitTime}ms after ${attemptCount} attempts`,
        ),
      );
    }, maxWaitTime);
  });

  // Create the polling function
  const pollForPackage = async (): Promise<void> => {
    while (true) {
      attemptCount++;
      console.log(
        `📱 Attempt ${attemptCount}: Checking if ${packageName} is installed...`,
      );

      try {
        // List all packages containing our package name
        const result = spawnSync("adb", ["shell", "pm", "list", "packages"], {
          encoding: "utf8",
          timeout: 10000,
        });

        if (result.stdout) {
          // Log all packages for debugging (filtered to relevant ones)
          const allPackages = result.stdout
            .split("\n")
            .filter((pkg) => pkg.trim());
          const relevantPackages = allPackages.filter(
            (pkg) =>
              pkg.includes("carpe") ||
              pkg.includes("wallet") ||
              pkg.includes("expo") ||
              pkg.includes("host.exp"),
          );

          console.log(
            `📦 Found ${relevantPackages.length} relevant packages out of ${allPackages.length} total:`,
          );
          relevantPackages.forEach((pkg) => console.log(`  ${pkg}`));

          // Also show the first 20 packages to see what format they're in
          if (attemptCount === 1) {
            console.log(`\n🔍 First 20 packages (for debugging):`);
            allPackages.slice(0, 20).forEach((pkg) => console.log(`  ${pkg}`));
            console.log(`\n`);
          }

          // Check if our specific package is installed
          const isInstalled = result.stdout.includes(`package:${packageName}`);

          if (isInstalled) {
            console.log(`✅ App ${packageName} is installed on device`);
            return;
          } else {
            console.log(
              `❌ Package ${packageName} not found in installed packages`,
            );
          }
        } else {
          console.log(`⚠️  No output from pm list packages command`);
        }

        if (result.error) {
          console.log(`⚠️  Error from adb command:`, result.error.message);
        }
      } catch (error) {
        console.log(`⚠️  Exception during package check:`, error);
      }

      // Wait 3 seconds before checking again
      console.log(`⏳ Waiting 3 seconds before next check...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  };

  // Race between timeout and polling - whichever completes first wins
  return Promise.race([pollForPackage(), timeoutPromise]);
}

export async function spawnExpoAndroid() {
  return new Promise<void>((resolve, reject) => {
    // Use bun script for all environments
    const expoProc = spawn("bun", ["android"], {
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
