import type { StyleProp, ViewStyle } from 'react-native';

export interface ScreenTimeReportViewProps {
  /** lockStore.familyActivitySelectionsByAppId 의 값들 (base64 FamilyActivitySelection 토큰). */
  selectionTokens: string[];
  style?: StyleProp<ViewStyle>;
}
