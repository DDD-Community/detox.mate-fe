const fs = require('fs');
const { IOSConfig, withFinalizedMod } = require('expo/config-plugins');

module.exports = function withExtensionEmbedOrder(config) {
  return withFinalizedMod(config, [
    'ios',
    (config) => {
      const project = IOSConfig.XcodeUtils.getPbxproj(config.modRequest.projectRoot);
      const phases = project.getFirstTarget().firstTarget.buildPhases;
      const embedIndex = phases.findIndex(
        (phase) => phase.comment === 'Embed Foundation Extensions'
      );
      const bundleIndex = phases.findIndex(
        (phase) => phase.comment === 'Bundle React Native code and images'
      );
      // apple-targets가 마지막에 추가하는 확장 복사를 Info.plist 수정 스크립트보다 먼저 실행한다.
      // 뒤에 두면 RNFirebase의 Info.plist 입력과 확장 복사 사이에 Xcode 의존성 순환이 생긴다.
      if (embedIndex > bundleIndex && bundleIndex !== -1) {
        const [embed] = phases.splice(embedIndex, 1);
        phases.splice(bundleIndex, 0, embed);
        fs.writeFileSync(project.filepath, project.writeSync());
      }
      return config;
    },
  ]);
};
