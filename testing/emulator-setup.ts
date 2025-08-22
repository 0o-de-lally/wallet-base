import { spawn, spawnSync, ChildProcess } from "child_process";

export async function waitForDeviceBoot() {
  // Wait until device is recognized
  spawnSync("adb", ["wait-for-device"], { stdio: "inherit" });
  // Poll for sys.boot_completed
  while (true) {
    const result = spawnSync("adb", ["shell", "getprop", "sys.boot_completed"]);
    if (result.stdout.toString().trim() === "1") break;
    await new Promise((res) => setTimeout(res, 1000));
  }
}

export function checkEmulatorAvailable(): boolean {
  try {
    const result = spawnSync("emulator", ["-list-avds"], { encoding: "utf8" });
    if (result.error) {
      console.error("Emulator command not found. Make sure Android SDK is installed and emulator is in PATH.");
      return false;
    }

    const avds = result.stdout.trim();
    if (!avds) {
      console.error("No Android Virtual Devices (AVDs) found. Please create an AVD first.");
      return false;
    }

    console.log(`Found AVDs: ${avds.split('\n').join(', ')}`);
    return true;
  } catch (error) {
    console.error("Failed to check emulator availability:", error);
    return false;
  }
}

export function checkRunningEmulators(): boolean {
  try {
    const result = spawnSync("adb", ["devices"], { encoding: "utf8" });
    if (result.error) {
      console.error("ADB command not found. Make sure Android SDK is installed and adb is in PATH.");
      return false;
    }

    const devices = result.stdout.trim().split('\n').slice(1); // Skip header line
    const runningEmulators = devices.filter(line => 
      line.includes('emulator-') && line.includes('device')
    );

    if (runningEmulators.length > 0) {
      console.log(`Found ${runningEmulators.length} running emulator(s):`);
      runningEmulators.forEach(device => console.log(`  ${device}`));
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to check running emulators:", error);
    return false;
  }
}

export function spawnEmulator(): ChildProcess | undefined {
  // Check if emulator is already running
  if (checkRunningEmulators()) {
    console.log("Emulator already running, skipping startup...");
    return;
  }

  const isCI = process.env.CI === "true";
  const args = ["-avd", "$(emulator -list-avds | head -n 1)"];

  if (isCI) {
    args.push("-no-window");
  }

  console.log("Starting emulator...");
  return spawn("emulator", args, {
    shell: true,
    stdio: "inherit",
    detached: true,
  });
}

export function findInstalledAppPackages(): string[] {
  try {
    const result = spawnSync("adb", ["shell", "pm", "list", "packages"], {
      encoding: "utf8",
      timeout: 10000
    });
    
    if (result.stdout) {
      const allPackages = result.stdout.split('\n').filter(pkg => pkg.trim());
      const relevantPackages = allPackages.filter(pkg => 
        pkg.includes('carpe') || pkg.includes('wallet') || pkg.includes('expo') || pkg.includes('host.exp')
      );
      
      console.log(`📦 All relevant packages found:`);
      relevantPackages.forEach(pkg => console.log(`  ${pkg}`));
      
      return relevantPackages;
    }
  } catch (error) {
    console.log(`⚠️  Error finding packages:`, error);
  }
  
  return [];
}

export async function waitForAppInstallation(packageName: string, maxWaitTime: number = 60000): Promise<void> {
  console.log(`Waiting for app installation: ${packageName}`);
  const startTime = Date.now();
  let attemptCount = 0;
  
  // Create a timeout promise that rejects after maxWaitTime
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: App ${packageName} was not installed within ${maxWaitTime}ms after ${attemptCount} attempts`));
    }, maxWaitTime);
  });
  
  // Create the polling promise
  const pollingPromise = new Promise<void>(async (resolve) => {
    while (true) {
      attemptCount++;
      console.log(`📱 Attempt ${attemptCount}: Checking if ${packageName} is installed...`);
      
      try {
        // List all packages containing our package name
        const result = spawnSync("adb", ["shell", "pm", "list", "packages"], {
          encoding: "utf8",
          timeout: 10000
        });
        
        if (result.stdout) {
          // Log all packages for debugging (filtered to relevant ones)
          const allPackages = result.stdout.split('\n').filter(pkg => pkg.trim());
          const relevantPackages = allPackages.filter(pkg => 
            pkg.includes('carpe') || pkg.includes('wallet') || pkg.includes('expo') || pkg.includes('host.exp')
          );
          
          console.log(`📦 Found ${relevantPackages.length} relevant packages out of ${allPackages.length} total:`);
          relevantPackages.forEach(pkg => console.log(`  ${pkg}`));
          
          // Also show the first 20 packages to see what format they're in
          if (attemptCount === 1) {
            console.log(`\n🔍 First 20 packages (for debugging):`);
            allPackages.slice(0, 20).forEach(pkg => console.log(`  ${pkg}`));
            console.log(`\n`);
          }
          
          // Check if our specific package is installed
          const isInstalled = result.stdout.includes(`package:${packageName}`);
          
          if (isInstalled) {
            console.log(`✅ App ${packageName} is installed on device`);
            resolve();
            return;
          } else {
            console.log(`❌ Package ${packageName} not found in installed packages`);
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
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  });
  
  // Race between timeout and polling - whichever completes first wins
  return Promise.race([pollingPromise, timeoutPromise]);
}