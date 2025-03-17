import { Buffer } from 'buffer';

try {
  if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
  }

  // if (typeof global.process === 'undefined') {
  //   global.process = { env: {} };
  // }

  // // Required by some crypto libraries
  // if (typeof global.btoa === 'undefined') {
  //   global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  // }

  // if (typeof global.atob === 'undefined') {
  //   global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
  // }

} catch (error) {
  console.error('Error initializing polyfills:', error);
}
