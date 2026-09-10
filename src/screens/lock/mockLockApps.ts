/**
 * 실기기 Screen Time 연동(react-native-device-activity) 도입 전까지 쓰는 목업 앱 목록.
 * 실제 연동 시 FamilyActivityPicker 결과로 대체된다.
 */
export interface LockCandidateApp {
  id: string;
  name: string;
}

export const MOCK_APP_CATALOG: LockCandidateApp[] = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'kakaotalk', name: 'KakaoTalk' },
  { id: 'discord', name: 'Discord' },
  { id: 'x', name: 'X' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'netflix', name: 'Netflix' },
];

export const GOAL_TIME_OPTIONS_MINUTES = [60, 120, 180, 240] as const;
