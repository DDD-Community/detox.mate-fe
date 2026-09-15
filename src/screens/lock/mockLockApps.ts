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
  { id: 'messages', name: '메시지' },
  { id: 'safari', name: 'Safari' },
];

export const GOAL_TIME_OPTIONS_MINUTES = [60, 120, 180, 240] as const;

/**
 * 그룹 친구 목록 연동 전까지 쓰는 목업 친구 풀.
 * 실제 연동 시 그룹 멤버 목록으로 대체된다.
 */
export const MOCK_FRIEND_POOL = ['한빈', '지민', '서연', '도윤', '하은'] as const;

export const pickRandomFriendNames = (count = 3): string[] =>
  [...MOCK_FRIEND_POOL].sort(() => Math.random() - 0.5).slice(0, count);
