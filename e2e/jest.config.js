// Renaming this file to bun.config.js would be ideal, but keeping as-is for Detox compatibility
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/deviceTests/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup', // Detox still needs these paths
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  // Bun has built-in transpilation, but keeping for compatibility
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/deviceTests/setup.js'],
};
