import { router } from 'expo-router';
import { Airbridge } from 'airbridge-react-native-sdk';
import { logError, normalizeError } from '../api/errors';
import { parseInviteDeeplink } from './inviteDestination';
import { setPendingInvite, type PendingInvite } from './pendingInvite';

const APP_NAME = 'detoxmate';
let nativeDelivery: PendingInvite | null = null;

// Expo의 native-intent와 SDK가 같은 네이티브 링크를 전달해도 SDK가 화면을 재시작하지 않는다.
export function markNativeInviteDelivery(invite: PendingInvite) {
  nativeDelivery = invite;
}

export function initAirbridge() {
  Airbridge.setOnDeeplinkReceived((deeplink: string) => {
    void handleInviteDeeplink(deeplink);
  });
}

export async function handleInviteDeeplink(deeplink: string) {
  const invite = parseInviteDeeplink(deeplink);
  if (!invite) return;
  if (nativeDelivery?.kind === invite.kind && nativeDelivery.code === invite.code) {
    nativeDelivery = null;
    return;
  }
  try {
    await setPendingInvite(invite);
    router.replace('/');
  } catch (error) {
    logError(normalizeError(error), { scope: 'app.bootstrap', operation: 'receiveInvite' });
  }
}

export function getInviteShareUrl(inviteCode: string): string {
  return `https://${APP_NAME}.airbridge.io/?invite_code=${inviteCode}`;
}
