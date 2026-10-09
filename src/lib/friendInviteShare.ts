import { AppError } from '../api/errors/normalizeError';
import { env } from '../config/env';

export function createFriendInviteShareUrl(code: string): string {
  if (!code.trim()) {
    throw AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' });
  }

  let url: URL;
  try {
    url = new URL(env.friendInviteBaseUrl ?? '');
    if (url.protocol !== 'https:' || url.pathname === '/' || url.username || url.password) {
      throw new Error('Invalid friend invite URL.');
    }
  } catch {
    throw AppError({ type: 'unknown', message: '친구 초대 공유 링크가 설정되지 않았어요.' });
  }

  url.searchParams.set('friend_invite_code', code);
  return url.toString();
}
