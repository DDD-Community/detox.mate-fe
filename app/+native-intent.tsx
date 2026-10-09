import { logError, normalizeError } from '../src/api/errors';
import { markNativeInviteDelivery } from '../src/lib/airbridge';
import { AIRBRIDGE_HOSTS, parseInviteDeeplink } from '../src/lib/inviteDestination';
import { setPendingInvite } from '../src/lib/pendingInvite';

export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  const invite = parseInviteDeeplink(path);
  if (invite) {
    markNativeInviteDelivery(invite);
    try {
      await setPendingInvite(invite);
    } catch (error) {
      logError(normalizeError(error), { scope: 'app.bootstrap', operation: 'saveNativeInvite' });
      // 직접 화면에 코드를 전달하여 저장 실패가 유효한 초대를 사라지게 하지 않는다.
      return invite.kind === 'friend'
        ? `/friend-invite?code=${encodeURIComponent(invite.code)}`
        : '/';
    }
    return '/';
  }
  try {
    const url = new URL(path);
    // 짧은 트래킹 URL은 Airbridge SDK가 실제 앱 딥링크로 해석한다.
    if (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      AIRBRIDGE_HOSTS.has(url.hostname)
    )
      return '/';
  } catch {
    // Expo 내부 경로 등은 기존 라우터에 그대로 위임한다.
  }
  return path;
}
