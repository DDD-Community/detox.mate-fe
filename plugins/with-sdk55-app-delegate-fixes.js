const fs = require('fs');
const path = require('path');
const { withAppDelegate, withDangerousMod } = require('expo/config-plugins');

const patchAppDelegate = (contents) =>
  contents
    .replace(/^import Expo$/m, 'internal import Expo')
    .replace(/^public class AppDelegate: ExpoAppDelegate/m, 'class AppDelegate: ExpoAppDelegate')
    .replace(/\bpublic override func application\(/g, 'override func application(')
    .replace(/\n\s*bindReactNativeFactory\(factory\)\n/, '\n');

const patchPodfile = (contents) => {
  let patchedContents = contents;

  if (!patchedContents.includes('$RNFirebaseAsStaticFramework = true')) {
    patchedContents = patchedContents.replace(
      /(\n\s*use_frameworks! :linkage => podfile_properties\['ios\.useFrameworks'\]\.to_sym if podfile_properties\['ios\.useFrameworks'\])/,
      '$1\n  $RNFirebaseAsStaticFramework = true'
    );
  }

  if (
    !patchedContents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES') &&
    patchedContents.includes('react_native_post_install(')
  ) {
    patchedContents = patchedContents.replace(
      /(\n\s*react_native_post_install\(\n\s*installer,\n\s*config\[:reactNativePath\],\n\s*:mac_catalyst_enabled => false,\n\s*:ccache_enabled => ccache_enabled\?\(podfile_properties\),\n\s*\))/,
      `$1

    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end`
    );
  }

  return patchedContents;
};

module.exports = function withSdk55AppDelegateFixes(config) {
  config = withAppDelegate(config, (config) => {
    if (config.modResults.language === 'swift') {
      config.modResults.contents = patchAppDelegate(config.modResults.contents);
    }

    return config;
  });

  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfilePath, 'utf8');
      const patchedContents = patchPodfile(contents);

      if (patchedContents !== contents) {
        fs.writeFileSync(podfilePath, patchedContents);
      }

      return config;
    },
  ]);
};
