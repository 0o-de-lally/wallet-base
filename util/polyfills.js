// React Native polyfills for Node.js modules
import "react-native-get-random-values";
import { Buffer } from 'buffer';

// Make Buffer available globally

if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

// Ensure Buffer is available on globalThis as well
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}
