import * as ReactNativeDeviceActivity from 'react-native-device-activity';

import { notifyUsageBarExtraMinutesChanged } from '../../modules/screen-time-report';

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

const USAGE_BAR_EXTRA_MINUTES_KEY = 'detox.usageBarExtraMinutes';

/**
 * 해제 시간 설정 화면의 스테퍼 값(추가로 쓸 분)을 사용 시간 막대(리포트 확장)에 실시간으로 전달한다.
 * 앱 그룹에 값을 쓰고 알림을 쏘면 확장이 값을 다시 읽어 막대를 갱신한다. 화면을 떠날 때는 0으로 되돌린다.
 */
export const syncUsageBarExtraMinutes = (minutes: number) => {
  try {
    ReactNativeDeviceActivity.userDefaultsSet(USAGE_BAR_EXTRA_MINUTES_KEY, minutes);
    notifyUsageBarExtraMinutesChanged();
  } catch {
    // 네이티브 모듈이 없는 환경에선 막대가 스테퍼를 따라가지 않을 뿐이다.
  }
};
