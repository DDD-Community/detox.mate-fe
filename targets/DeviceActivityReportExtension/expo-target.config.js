/**
 * DeviceActivityReport 익스텐션. react-native-device-activity 패키지의 config-plugin은
 * shield-action/shield-configuration/device-activity-monitor 3종만 지원해서(이 4번째 타입은
 * 지원 안 함), @kingstinct/expo-apple-targets를 직접 써서 수동으로 정의한다.
 *
 * `type` 문자열은 라이브러리가 미리 아는 프리셋이 아니라서 frameworks/entitlements를
 * 전부 직접 채워야 한다. Info.plist도 자동 생성되지 않아서(이미 파일이 있으면 건드리지
 * 않음) 직접 작성했다. NSExtensionPrincipalClass는 일부러 안 넣었다 — Swift @main으로
 * 진입점을 잡는 방식이라 필요 없다(예전 Xcode에선 이 키가 있으면 기기 설치가 실패하는
 * 버그가 있었고, 그 우회법으로 EXAppExtensionAttributes를 쓰라는 정보도 있었지만, 이
 * Xcode 버전에서는 그 방식 자체가 시뮬레이터 설치를 실패시켜서 표준 NSExtension 구조로
 * 되돌렸다).
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
