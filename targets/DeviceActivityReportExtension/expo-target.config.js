/**
 * react-native-device-activity가 생성하지 않는 리포트 확장.
 * @kingstinct/expo-apple-targets의 pnpm 패치로 ExtensionKit 타깃을 생성한다.
 * Info.plist와 타깃 타입을 함께 유지해야 App Store 검증과 기기 설치가 통과한다.
 */
module.exports = () => ({
  type: 'device-activity-report',
  // DeviceActivityReportExtension/DeviceActivityReportScene 등 SwiftUI 연동 API는
  // 별도 프레임워크가 아니라 DeviceActivity.framework 안에 있다(내부적으로
  // _DeviceActivity_SwiftUI라는 언더스코어 프레임워크를 자동 링크함) — "DeviceActivityUI"라는
  // 이름의 링크 가능한 프레임워크는 존재하지 않는다(ld: framework 'DeviceActivityUI' not found).
  frameworks: ['DeviceActivity', 'SwiftUI'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.detoxmate.app.dev2'],
  },
});
