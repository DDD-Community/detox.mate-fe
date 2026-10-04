import * as ReactNativeDeviceActivity from 'react-native-device-activity';

// 스크린타임 리포트 익스텐션(별도 프로세스)이 읽는 값은 앱 그룹 UserDefaults로만 넘길 수 있다.
// 키 이름은 targets/DeviceActivityReportExtension/AppPercentReportScene.swift와 같아야 한다.
const TARGET_MINUTES_KEY = 'detox.targetMinutes';

/** 오늘 제한 시간(분)을 익스텐션이 읽을 수 있게 앱 그룹에 써둔다. */
export const syncTargetMinutes = (minutes: number) => {
  try {
    ReactNativeDeviceActivity.userDefaultsSet(TARGET_MINUTES_KEY, minutes);
  } catch {
    // 네이티브 모듈이 없는 환경(시뮬레이터 등)에선 조용히 넘어간다 — 퍼센트만 "-"로 보인다.
  }
};
