import { spawnSync, ChildProcess } from "child_process";
import { WebSocket } from "ws";
import { readFileSync } from "fs";
import { get } from "http";

import { secureError } from "../util/error-utils";
import {
  waitForDeviceBoot,
  checkEmulatorAvailable,
  spawnEmulator,
  spawnExpoAndroid,
  waitForAppInstallation,
  findInstalledAppPackages,
} from "./emulator-setup";

let emulatorProc: ChildProcess | undefined;
let expoProc: ChildProcess | undefined;
let debuggerWs: WebSocket | undefined;

function killAll() {
  if (debuggerWs && debuggerWs.readyState === WebSocket.OPEN) {
    debuggerWs.close();
  }
  if (expoProc && !expoProc.killed) expoProc.kill();
  if (emulatorProc && !emulatorProc.killed) emulatorProc.kill();
}

process.on("SIGINT", () => {
  killAll();
  process.exit(1);
});
process.on("exit", killAll);

async function checkDevMenuOpened(): Promise<boolean> {
  console.log("🔍 Checking if dev menu opened...");

  try {
    // Get current UI dump to look for dev menu elements
    const uiDumpResult = spawnSync(
      "adb",
      [
        "shell",
        "uiautomator",
        "dump",
        "/sdcard/ui_dump.xml",
        "&&",
        "cat",
        "/sdcard/ui_dump.xml",
      ],
      {
        encoding: "utf8",
        timeout: 10000,
      },
    );

    if (uiDumpResult.stdout) {
      const uiDump = uiDumpResult.stdout.toLowerCase();

      // Look for common dev menu text patterns
      const devMenuIndicators = [
        "debug",
        "reload",
        "dev settings",
        "developer menu",
        "react developer",
        "remote debugger",
        "chrome",
        "flipper",
      ];

      const foundIndicators = devMenuIndicators.filter((indicator) =>
        uiDump.includes(indicator),
      );

      if (foundIndicators.length > 0) {
        console.log(
          `✅ Dev menu detected! Found indicators: ${foundIndicators.join(", ")}`,
        );
        return true;
      } else {
        console.log("❌ No dev menu indicators found in UI dump");

        // Log a snippet of the UI dump for debugging
        const snippet = uiDump.substring(0, 300);
        console.log(`📄 UI dump snippet: ${snippet}...`);
        return false;
      }
    } else {
      console.log("⚠️  Could not get UI dump");
      return false;
    }
  } catch (error) {
    console.log(
      "⚠️  Error checking for dev menu:",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

async function enableRemoteDebugging(): Promise<void> {
  console.log("🔧 Attempting to enable remote debugging...");

  try {
    // First, launch the app if not already running
    console.log("📱 Launching app with debugging support...");
    spawnSync(
      "adb",
      ["shell", "am", "start", "-n", "app.carpe.wallet_base/.MainActivity"],
      {
        encoding: "utf8",
        timeout: 10000,
      },
    );

    // Wait for app to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Multiple approaches to open the React Native dev menu
    console.log("📳 Attempting to open React Native dev menu...");

    // Method 1: Hardware menu button (most reliable for emulators)
    console.log("🔘 Trying hardware menu button (F2/Menu key)...");
    spawnSync("adb", ["shell", "input", "keyevent", "KEYCODE_MENU"], {
      encoding: "utf8",
      timeout: 5000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Method 2: Send accelerometer shake simulation (more realistic)
    console.log("🤳 Simulating device shake with accelerometer...");
    const shakeCommands = [
      ["shell", "am", "broadcast", "-a", "com.facebook.react.devsupport.SHAKE"],
      ["shell", "am", "broadcast", "-a", "android.intent.action.SHAKE"],
      // Multiple rapid accelerometer changes to simulate shake
      [
        "shell",
        "am",
        "broadcast",
        "-a",
        "com.facebook.react.devsupport.ACCELEROMETER_SHAKE",
      ],
    ];

    for (const cmd of shakeCommands) {
      spawnSync("adb", cmd, { encoding: "utf8", timeout: 3000 });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Method 3: Try R key (another common dev menu trigger)
    console.log("🇷 Trying R key for reload menu...");
    spawnSync("adb", ["shell", "input", "keyevent", "46"], {
      // KEYCODE_R
      encoding: "utf8",
      timeout: 3000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Method 4: Try double R key
    console.log("🇷🇷 Trying double R key...");
    spawnSync("adb", ["shell", "input", "keyevent", "46", "46"], {
      encoding: "utf8",
      timeout: 3000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Method 5: Alternative broadcast methods
    console.log("📡 Trying React Native specific broadcasts...");
    const broadcasts = [
      "com.facebook.react.devsupport.RELOAD",
      "com.facebook.react.devsupport.SHOW_DEV_OPTIONS",
      "com.facebook.react.devsupport.TOGGLE_DEBUG_OVERLAY",
    ];

    for (const broadcast of broadcasts) {
      spawnSync("adb", ["shell", "am", "broadcast", "-a", broadcast], {
        encoding: "utf8",
        timeout: 3000,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Give some time for any dev menu to appear
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to automatically enable debugging if dev menu appeared
    console.log("🎯 Attempting to auto-select debugging options...");

    // Try tapping on common debug option locations (this is a bit of a guess)
    const debugTaps = [
      // Common locations where "Debug with Chrome" might appear
      ["shell", "input", "tap", "500", "400"], // Center-ish
      ["shell", "input", "tap", "500", "500"], // Lower center
      ["shell", "input", "tap", "400", "600"], // Lower left
      ["shell", "input", "tap", "600", "600"], // Lower right
    ];

    for (const tap of debugTaps) {
      spawnSync("adb", tap, { encoding: "utf8", timeout: 2000 });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      "✅ Remote debugging activation attempted with multiple methods",
    );
  } catch (error) {
    console.log("⚠️  Could not programmatically enable debugging:", error);
    console.log("💡 You may need to manually enable remote debugging:");
    console.log("   1. Open the app on the emulator");
    console.log(
      "   2. Shake the device (Ctrl+M on emulator) or press Menu key",
    );
    console.log("   3. Select 'Debug' or 'Debug with Chrome'");
    console.log("   4. Or try double-tapping R key in the emulator");
  }
}

async function checkMetroHealth(): Promise<void> {
  console.log("🏥 Checking Metro server health...");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Metro health check timeout"));
    }, 10000);

    get("http://localhost:8081/status", (res) => {
      clearTimeout(timeout);
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(
          `📊 Metro status response (${res.statusCode}):`,
          data.substring(0, 200),
        );
        if (res.statusCode === 200) {
          console.log("✅ Metro server is healthy");
          resolve();
        } else {
          reject(new Error(`Metro server returned status ${res.statusCode}`));
        }
      });
    }).on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Metro health check failed: ${err.message}`));
    });
  });
}

async function checkDebuggerEndpoint(): Promise<void> {
  console.log("🔍 Checking debugger endpoint availability...");

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Debugger endpoint check timeout"));
    }, 5000);

    // Try to access the debugger-proxy endpoint via HTTP first
    get("http://localhost:8081/debugger-proxy", (res) => {
      clearTimeout(timeout);
      console.log(`🔌 Debugger endpoint HTTP status: ${res.statusCode}`);

      if (res.statusCode === 400 || res.statusCode === 426) {
        // 400 or 426 (Upgrade Required) are expected for websocket endpoints accessed via HTTP
        console.log(
          "✅ Debugger endpoint is available (websocket upgrade expected)",
        );
        resolve();
      } else {
        reject(
          new Error(`Unexpected debugger endpoint status: ${res.statusCode}`),
        );
      }
    }).on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Debugger endpoint check failed: ${err.message}`));
    });
  });
}

async function waitForAppInitialization(): Promise<void> {
  console.log("⏳ Waiting for app initialization logs...");
  const maxWaitTime = 120000; // 2 minutes
  const checkInterval = 2000; // Check every 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check logcat for the initialization message
      const result = spawnSync("adb", ["logcat", "-d", "-s", "ReactNativeJS"], {
        encoding: "utf8",
        timeout: 5000,
      });

      if (
        result.stdout &&
        result.stdout.includes("Error logging system initialized")
      ) {
        console.log(
          "✅ App initialization detected - error logging system is ready",
        );
        return;
      }

      console.log("🔍 App not yet initialized, waiting...");
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    } catch (error) {
      console.log(
        "⚠️  Error checking logs:",
        error instanceof Error ? error.message : String(error),
      );
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  throw new Error("Timeout waiting for app initialization");
}

async function enableDebuggingAndConnect(): Promise<void> {
  const maxAttempts = 10;
  const retryDelay = 5000; // 5 seconds between attempts

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
      `\n🔄 Attempt ${attempt}/${maxAttempts}: Enabling debugging and connecting...`,
    );

    try {
      // First, enable remote debugging
      console.log("🔧 Enabling remote debugging...");
      await enableRemoteDebugging();

      // Check if dev menu actually opened
      const devMenuOpened = await checkDevMenuOpened();
      if (!devMenuOpened) {
        throw new Error("Dev menu did not open - cannot enable debugging");
      }

      // Wait for debugging to take effect
      console.log("⏳ Waiting for debugging to be enabled...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check Metro health
      try {
        await checkMetroHealth();
      } catch (error) {
        console.log(
          "⚠️  Metro health check failed:",
          error instanceof Error ? error.message : String(error),
        );
      }

      // Check debugger endpoint
      try {
        await checkDebuggerEndpoint();
      } catch (error) {
        console.log(
          "⚠️  Debugger endpoint not ready:",
          error instanceof Error ? error.message : String(error),
        );
        throw error; // Re-throw to retry the whole process
      }

      // Now try to connect to the debugger
      console.log(`🔌 Attempting WebSocket connection...`);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000); // 10 second timeout per attempt

        debuggerWs = new WebSocket(
          "ws://localhost:8081/debugger-proxy?role=debugger&name=e2e-test",
        );

        debuggerWs.on("open", () => {
          clearTimeout(timeout);
          console.log("✅ Connected to Metro debugger");
          resolve();
        });

        debuggerWs.on("error", (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket connection failed: ${error.message}`));
        });

        debuggerWs.on("close", () => {
          console.log("🔌 Debugger WebSocket connection closed");
        });
      });

      // If we get here, everything was successful
      console.log("🎉 Successfully enabled debugging and connected to Metro!");
      return;
    } catch (error) {
      console.log(
        `❌ Attempt ${attempt} failed:`,
        error instanceof Error ? error.message : String(error),
      );

      // Clean up any partial websocket connection
      if (debuggerWs) {
        debuggerWs.removeAllListeners();
        if (debuggerWs.readyState === WebSocket.OPEN) {
          debuggerWs.close();
        }
        debuggerWs = undefined;
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${retryDelay}ms before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(
    `Failed to enable debugging and connect after ${maxAttempts} attempts. The app may not support remote debugging or Metro may have bundling issues.`,
  );
}

async function executeJavaScript(code: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!debuggerWs || debuggerWs.readyState !== WebSocket.OPEN) {
      reject(new Error("WebSocket not connected"));
      return;
    }

    const messageId = Date.now();
    const message = {
      id: messageId,
      method: "Runtime.evaluate",
      params: {
        expression: code,
        returnByValue: true,
        awaitPromise: true,
      },
    };

    const timeout = setTimeout(() => {
      reject(new Error("Timeout executing JavaScript"));
    }, 10000);

    const messageHandler = (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.id === messageId) {
          clearTimeout(timeout);
          debuggerWs?.removeListener("message", messageHandler);

          if (response.error) {
            reject(
              new Error(
                `JavaScript execution error: ${JSON.stringify(response.error)}`,
              ),
            );
          } else if (response.result?.exceptionDetails) {
            reject(
              new Error(
                `JavaScript exception: ${response.result.exceptionDetails.text}`,
              ),
            );
          } else {
            resolve(response.result?.result?.value);
          }
        }
      } catch {
        // Ignore parse errors for other messages
      }
    };

    debuggerWs.on("message", messageHandler);
    debuggerWs.send(JSON.stringify(message));
  });
}

async function runWebSocketTests(): Promise<void> {
  console.log("Starting WebSocket-based tests...");

  try {
    // First, load and execute the test file on the device
    console.log("Loading test module on device...");

    // Read the test file content
    const testContent = readFileSync("./test/hello-world.test.js", "utf8");

    // Execute the test content on the device
    await executeJavaScript(`
      // Load the test module
      ${testContent}

      // Execute the main test function
      runTests().then(() => {
        console.log('All tests completed successfully!');
      }).catch((error) => {
        console.error('Test execution failed:', error.message);
        throw error;
      });
    `);

    console.log("✅ WebSocket tests completed successfully");
  } catch (error) {
    console.error("❌ WebSocket test execution failed:", error);
    throw error;
  }
}

async function main() {
  // First check if emulator is available
  console.log("Checking emulator availability...");
  if (!checkEmulatorAvailable()) {
    process.exit(1);
  }

  try {
    // Start the emulator first
    emulatorProc = spawnEmulator();
    await waitForDeviceBoot();

    // WebSocket-based testing
    console.log("🔗 Running WebSocket-based tests...");

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

    // Wait for the app to initialize and show logs
    await waitForAppInitialization();

    // Now enable debugging and connect in a coordinated loop
    await enableDebuggingAndConnect();
    await runWebSocketTests();

    console.log("🎉 All WebSocket tests completed successfully!");
  } catch (err) {
    console.error("❌ WebSocket test execution failed:");
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
