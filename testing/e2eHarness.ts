import { spawn, spawnSync } from 'child_process';

async function waitForDeviceBoot() {
  // Wait until device is recognized
  spawnSync('adb', ['wait-for-device'], { stdio: 'inherit' });
  // Poll for sys.boot_completed
  while (true) {
    const result = spawnSync('adb', ['shell', 'getprop', 'sys.boot_completed']);
    if (result.stdout.toString().trim() === '1') break;
    await new Promise(res => setTimeout(res, 1000));
  }
}

let emulatorProc: any;
let expoProc: any;
let maestroProc: any;

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

function spawnEmulator() {
  emulatorProc = spawn("emulator", ["-avd", "$(emulator -list-avds | head -n 1)"], {
    shell: true,
    stdio: "inherit",
    detached: true,
  });
}

async function spawnExpoAndroid() {
  return new Promise<void>((resolve, reject) => {
    expoProc = spawn("bun", ["android"], { stdio: ["pipe", "pipe", "inherit"] });
    let isResolved = false;

    expoProc.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("Android Bundled") && !isResolved) {
        isResolved = true;
        resolve();
      }
    });

    expoProc.on("exit", (code: number) => {
      if (!isResolved) {
        if (code !== 0) {
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
    maestroProc.on("exit", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Maestro test failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  spawnEmulator();
  await waitForDeviceBoot();
  try {
    await spawnExpoAndroid();
    await spawnMaestroTest();
  } catch (err) {
    killAll();
    console.error(err);
    process.exit(1);
  }
  killAll();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
