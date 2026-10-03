import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';

declare class ScreenTimeReportModule extends NativeModule {
  minimizeApp(): void;
}

const nativeModule =
  Platform.OS === 'ios' ? requireNativeModule<ScreenTimeReportModule>('ScreenTimeReport') : null;

/** 홈 버튼을 누른 것처럼 앱을 백그라운드로 내려보낸다(iOS 전용, 실제 종료는 불가). */
export const minimizeApp = () => {
  nativeModule?.minimizeApp();
};
