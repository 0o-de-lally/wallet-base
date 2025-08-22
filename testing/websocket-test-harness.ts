import { spawn, ChildProcess } from "child_process";
import { WebSocket } from "ws";
import { readFileSync } from "fs";

import { secureError } from "../util/error-utils";
import {
  waitForDeviceBoot,
  checkEmulatorAvailable,
  spawnEmulator,
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

async function spawnExpoAndroid() {
  return new Promise<void>((resolve, reject) => {
    const isCI = process.env.CI === "true";

    if (isCI) {
      // In CI, use expo directly with non-interactive flags
      expoProc = spawn("bunx", ["expo", "start", "--dev", "--android"], {
        stdio: ["pipe", "pipe", "inherit"],
        env: { ...process.env, EXPO_NO_PROMPTS: "true" },
      });
    } else {
      // Local development, use expo start in dev mode
      expoProc = spawn("bunx", ["expo", "start", "--dev"], {
        stdio: ["pipe", "pipe", "inherit"],
      });
    }
    let isResolved = false;

    expoProc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stdout.write(text); // Forward all output to stdout
      if (
        (text.includes("Metro waiting") || text.includes("Waiting on")) &&
        !isResolved
      ) {
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

async function connectToDebugger(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout connecting to Metro debugger"));
    }, 30000);

    debuggerWs = new WebSocket(
      "ws://localhost:8081/debugger-proxy?role=debugger&name=e2e-test",
    );

    debuggerWs.on("open", () => {
      clearTimeout(timeout);
      console.log("Connected to Metro debugger");
      resolve();
    });

    debuggerWs.on("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket connection failed: ${error.message}`));
    });

    debuggerWs.on("close", () => {
      console.log("Debugger WebSocket connection closed");
    });
  });
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
    // Start the emulator first (unless in CI where it's already started)
    const isCI = process.env.CI === "true";
    if (!isCI) {
      emulatorProc = spawnEmulator();
    } else {
      console.log(
        "Running in CI - skipping emulator startup (already handled by CI)",
      );
    }
    await waitForDeviceBoot();

    // WebSocket-based testing
    console.log("🔗 Running WebSocket-based tests...");

    // Start Expo in development mode
    console.log("Starting Expo in development mode...");
    await spawnExpoAndroid();

    // Wait a bit for Metro to be fully ready
    console.log("Waiting for Metro to initialize...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Connect to Metro debugger and run tests
    await connectToDebugger();
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
