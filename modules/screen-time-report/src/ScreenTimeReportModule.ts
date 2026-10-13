import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';

declare class ScreenTimeReportModule extends NativeModule {
  minimizeApp(): void;
  splitSelection(token: string): string[];
  notifyUsageBarExtraMinutesChanged(): void;
}

const nativeModule =
  Platform.OS === 'ios' ? requireNativeModule<ScreenTimeReportModule>('ScreenTimeReport') : null;

/** 홈 버튼을 누른 것처럼 앱을 백그라운드로 내려보낸다(iOS 전용, 실제 종료는 불가). */
export const minimizeApp = () => {
  nativeModule?.minimizeApp();
};

/**
 * 여러 앱이 합쳐진 선택 토큰을 앱 하나짜리 토큰들로 쪼갠다(카테고리/웹사이트는 묶음 하나로 남김).
 * 네이티브 모듈이 없거나 실패하면 원본 토큰 하나를 그대로 돌려준다.
 */
export const splitSelection = (token: string): string[] => {
  const tokens = nativeModule?.splitSelection(token);
  return tokens && tokens.length > 0 ? tokens : [token];
};

/** 스테퍼 값이 바뀌었다고 리포트 확장에 알린다(iOS 전용). 값은 먼저 앱 그룹에 써 둬야 한다. */
export const notifyUsageBarExtraMinutesChanged = () => {
  nativeModule?.notifyUsageBarExtraMinutesChanged();
};
