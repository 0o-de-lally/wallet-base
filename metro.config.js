const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add alias for buffer polyfill
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

// Add buffer to the list of modules to be resolved as packages
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
