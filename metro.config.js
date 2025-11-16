const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js core modules
config.resolver.extraNodeModules = {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('readable-stream'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser'),
  url: require.resolve('url'),
  zlib: require.resolve('browserify-zlib'),
  path: require.resolve('path-browserify'),
  vm: require.resolve('vm-browserify'),
  assert: require.resolve('assert'),
  util: require.resolve('util'),
  events: require.resolve('events'),
  buffer: require.resolve('buffer'),
  process: require.resolve('process/browser'),
  fs: require.resolve('react-native-fs'),
  tty: false,
};

// Add global polyfills
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
