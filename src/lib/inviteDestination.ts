import type { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { logError, normalizeError } from '../api/errors';
import { clearPendingInvite, peekPendingInvite, type PendingInvite } from './pendingInvite';

type Destination = Parameters<typeof router.replace>[0];

export const AIRBRIDGE_HOSTS = new Set(['detoxmate.airbridge.io', 'detoxmate.abr.ge']);

export function parseInviteDeeplink(path: string): PendingInvite | null {
  let url: URL;
  try {
    url = new URL(path);
  } catch {
    return null;
  }
  const appScheme = url.protocol === 'detoxmate:';
  const trackingLink =
    (url.protocol === 'https:' || url.protocol === 'http:') && AIRBRIDGE_HOSTS.has(url.hostname);
  if (!appScheme && !trackingLink) return null;

  const route = (
    appScheme && url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname
  ).replace(/\/$/, '');
  if (route === '/friend-invite') {
    const code = url.searchParams.get('code');
    return code ? { kind: 'friend', code } : null;
  }
  if (route === '' || route === '/' || route === '/join') {
    const code = url.searchParams.get('invite_code');
    return code ? { kind: 'group', code } : null;
  }
  return null;
}

export function getInviteDestination(invite: PendingInvite): Destination {
  return invite.kind === 'friend'
    ? { pathname: '/friend-invite', params: { code: invite.code } }
    : { pathname: '/(group)/join', params: { inviteCode: invite.code } };
}

/** 기본 화면 조회가 끝날 때에도 초대·세션을 다시 확인하여 늦은 딥링크를 보존한다. */
export async function navigateAuthenticated({
  replace,
  resolveDefault,
  isActive = () => true,
}: {
  replace: (destination: Destination) => void;
  resolveDefault: () => Promise<Destination>;
  isActive?: () => boolean;
}): Promise<void> {
  const navigatePending = async (): Promise<boolean> => {
    const pending = await peekPendingInvite();
    const accessToken = await SecureStore.getItemAsync('accessTokenKey');
    if (!isActive()) return true;
    if (!accessToken) {
      replace('/login');
      return true;
    }
    if (!pending) return false;
    replace(getInviteDestination(pending));
    try {
      await clearPendingInvite(pending);
    } catch (error) {
      logError(normalizeError(error), { scope: 'app.bootstrap', operation: 'clearPendingInvite' });
    }
    return true;
  };

  if (await navigatePending()) return;
  const destination = await resolveDefault();
  if (await navigatePending()) return;
  if (isActive()) replace(destination);
}
