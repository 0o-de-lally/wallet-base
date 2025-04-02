import { cleanup } from '@testing-library/react-native';
import { device } from 'detox';

// Ensure Bun test hooks are used
// Note: Bun's test hooks are compatible with Jest's
beforeAll(async () => {
  await device.launchApp();
});

afterEach(() => {
  cleanup();
});

afterAll(async () => {
  await device.terminateApp();
});
