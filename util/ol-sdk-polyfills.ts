import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';

console.time('polyfills-init');
try {
  if (typeof global.Buffer === 'undefined') {
    console.log('[PERF] Adding Buffer polyfill');
    global.Buffer = Buffer;
  }

  if (typeof global.crypto === 'undefined') {
    console.log('[PERF] Adding crypto polyfill');
    // @ts-expect-error missing subtle
    global.crypto = Crypto;
  }
} catch (error) {
  console.error('Error initializing polyfills:', error);
} finally {
  console.timeEnd('polyfills-init');
}
