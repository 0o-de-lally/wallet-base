import { Buffer } from "buffer";
import * as Crypto from "expo-crypto";

try {
  if (typeof global.Buffer === "undefined") {
    global.Buffer = Buffer;
  }

  if (typeof global.crypto === "undefined") {
    // @ts-expect-error missing subtle
    global.crypto = Crypto;
  }
} catch (error) {
  console.error("Error initializing polyfills:", error);
}
