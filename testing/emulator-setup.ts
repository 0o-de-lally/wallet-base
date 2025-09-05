import { spawn, spawnSync, ChildProcess } from "child_process";

export async function waitForDeviceBoot() {
  console.log("Waiting for device to be recognized...");
  
  // Wait until device is recognized (with timeout)
  let deviceFound = false;
  for (let i = 0; i < 60; i++) { // 60 second timeout
    const result = spawnSync("adb", ["devices"], { encoding: "utf8" });
    if (result.stdout && result.stdout.includes("device") && !result.stdout.includes("offline")) {
      deviceFound = true;
      console.log("Device found in adb devices");
      break;
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  
  if (!deviceFound) {
    throw new Error("Device not found in adb devices after 60 seconds");
  }
  
  console.log("Waiting for device boot to complete...");
  // Poll for sys.boot_completed with timeout
  for (let i = 0; i < 120; i++) { // 2 minute timeout for boot
    const result = spawnSync("adb", ["shell", "getprop", "sys.boot_completed"], { encoding: "utf8" });
    if (result.stdout && result.stdout.toString().trim() === "1") {
      console.log("Device boot completed");
      return;
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  
  throw new Error("Device boot did not complete within 2 minutes");
}

export function checkSystemImagesAvailable(): boolean {
  try {
    const result = spawnSync("/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager", ["--list"], { encoding: "utf8" });
    if (result.error) {
      console.error("SDK Manager not found or failed");
      return false;
    }

    // Check if Android 30 system image is installed
    const hasAndroid30 = result.stdout.includes("system-images;android-30;google_apis;x86_64");
    
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
    const result = spawnSync("emulator", ["-list-avds"], { encoding: "utf8" });
    if (result.error) {
      console.error(
        "Emulator command not found. Make sure Android SDK is installed and emulator is in PATH.",
      );
      return false;
    }

    const output = result.stdout.trim();
    
    // Handle case where emulator command returns status messages instead of AVD list
    if (output.includes("Android Virtual Device Manager") || 
        output.includes("Emulator started")) {
      console.log("Emulator command available");
      // Check if system images are available before proceeding
      return checkSystemImagesAvailable();
    }

    if (!output) {
      console.log("No existing AVDs found - checking system images");
      return checkSystemImagesAvailable();
    }

    console.log(`Found existing AVDs: ${output.split("\n").join(", ")}`);
    return true;
  } catch (error) {
    console.error("Failed to check emulator availability:", error);
    return false;
  }
}

function checkRunningEmulators(): boolean {
  try {
    const result = spawnSync("adb", ["devices"], { encoding: "utf8" });
    if (result.error) {
      console.error(
        "ADB command not found. Make sure Android SDK is installed and adb is in PATH.",
      );
      return false;
    }

    const devices = result.stdout.trim().split("\n").slice(1); // Skip header line
    const runningEmulators = devices.filter(
      (line) => line.includes("emulator-") && line.includes("device"),
    );

    if (runningEmulators.length > 0) {
      console.log(`Found ${runningEmulators.length} running emulator(s):`);
      runningEmulators.forEach((device) => console.log(`  ${device}`));
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to check running emulators:", error);
    return false;
  }
}

export function createEmulatorWithMaestro(): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("Creating emulator with Maestro...");
    
    const maestroProc = spawn("maestro", ["start-device", "--platform", "android"], {
      stdio: ["pipe", "pipe", "inherit"],
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:${process.env.HOME}/.maestro/bin`
      }
    });

    let output = "";
    maestroProc.stdout?.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());
    });

    maestroProc.on("exit", (code) => {
      if (code === 0) {
        // Extract AVD name from output
        const match = output.match(/Created Android emulator: ([^\s]+)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error("Could not find created emulator name"));
        }
      } else {
        reject(new Error(`Maestro failed with code ${code}`));
      }
    });
  });
}

export function spawnEmulator(): ChildProcess | undefined {
  // Check if emulator is already running
  if (checkRunningEmulators()) {
    console.log("Emulator already running, skipping startup...");
    return;
  }

  console.log("Starting emulator with proper configuration...");
  
  // Use the correct AVD name that Maestro created
  const emulatorProc = spawn("emulator", [
    "-avd", "Maestro_Pixel_6_API_30_1",
    "-no-window",
    "-no-audio", 
    "-no-boot-anim",
    "-gpu", "swiftshader_indirect",
    "-memory", "2048"
  ], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false // Keep attached so we can monitor it
  });

  // Log emulator output for debugging
  emulatorProc.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`Emulator: ${output}`);
    }
  });

  emulatorProc.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('pulseaudio')) { // Ignore audio warnings
      console.log(`Emulator stderr: ${output}`);
    }
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
