const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Handle Firebase CommonJS (.cjs) files
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Fix Firebase + Expo SDK 53+ package exports issue
config.resolver.unstable_enablePackageExports = false;

// Minifier options for smaller + faster production bundles
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: { toplevel: false },
    output: { ascii_only: true, quote_style: 3, wrap_iife: true },
    sourceMap: { includeSources: false },
    toplevel: false,
    compress: {
      reduce_funcs: false,
    },
  },
};

module.exports = config;
