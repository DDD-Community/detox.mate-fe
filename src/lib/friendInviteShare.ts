import { AppError } from '../api/errors/normalizeError';

// 사용자마다 Airbridge 트래킹 링크를 만들지 않고, 같은 코드면 항상 같은 URL이 되도록 만든다.
// 앱 설치 상태에서는 Universal Link로 열리고 parseInviteDeeplink가 이 경로를 해석한다.
const FRIEND_INVITE_URL = 'https://detoxmate.airbridge.io/friend-invite';

export function createFriendInviteShareUrl(code: string): string {
  if (!code.trim()) {
    throw AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' });
  }

  const url = new URL(FRIEND_INVITE_URL);
  url.searchParams.set('code', code);
  return url.toString();
}
