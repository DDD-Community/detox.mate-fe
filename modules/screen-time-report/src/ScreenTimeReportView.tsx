import { requireNativeViewManager } from 'expo-modules-core';
import type { ComponentType } from 'react';
import { Platform, View } from 'react-native';
import type { ScreenTimeReportViewProps } from './ScreenTimeReportView.types';

// DeviceActivityReport는 Apple 전용 API라 iOS에서만 실제 네이티브 뷰를 로드한다.
// Android/web에서는 아무것도 그리지 않는 빈 뷰로 대체한다.
export const ScreenTimeReportView: ComponentType<ScreenTimeReportViewProps> =
  Platform.OS === 'ios' ? requireNativeViewManager('ScreenTimeReport') : (() => <View />);
