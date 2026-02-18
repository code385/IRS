// Metro config tweaked for Firebase + Expo (CommonJS format for Node on Windows)
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Firebase's CommonJS (.cjs) files are handled correctly
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Work around Firebase + Expo SDK 53+ package exports issue
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

