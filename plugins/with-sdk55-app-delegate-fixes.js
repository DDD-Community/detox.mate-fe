const { withAppDelegate } = require('expo/config-plugins');

const patchAppDelegate = (contents) =>
  contents
    .replace(/^import Expo$/m, 'internal import Expo')
    .replace(/^public class AppDelegate: ExpoAppDelegate/m, 'class AppDelegate: ExpoAppDelegate')
    .replace(/\bpublic override func application\(/g, 'override func application(')
    .replace(/\n\s*bindReactNativeFactory\(factory\)\n/, '\n');

module.exports = function withSdk55AppDelegateFixes(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'swift') {
      config.modResults.contents = patchAppDelegate(config.modResults.contents);
    }

    return config;
  });
};
