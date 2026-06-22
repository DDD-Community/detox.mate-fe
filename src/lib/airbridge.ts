import { router } from 'expo-router';
import { Airbridge } from 'airbridge-react-native-sdk';
import { setPendingInviteCode } from './pendingInvite';

const APP_NAME = 'detoxmate';
const APP_TOKEN = 'de33f6fd010d4db794542d3a0c05b7a4';

export function initAirbridge() {
  Airbridge.setOnDeeplinkReceived((deeplink: string) => {
    void handleInviteDeeplink(deeplink);
  });
}

async function handleInviteDeeplink(deeplink: string) {
  try {
    const url = new URL(deeplink);
    const inviteCode = url.searchParams.get('invite_code');
    if (!inviteCode) return;

    // 라우팅 경합을 피하기 위해 여기서 직접 화면 이동하지 않고 코드만 저장한 뒤,
    // 진입점('/')으로 보내 SplashScreen이 인증 상태를 보고 초대 화면으로 연결하게 한다.
    // (콜드 스타트는 물론, 앱이 이미 떠 있는 웜 스타트에서도 일관되게 동작)
    await setPendingInviteCode(inviteCode);
    router.replace('/');
  } catch {
    // 파싱 실패 시 무시
  }
}

export function getInviteShareUrl(inviteCode: string): string {
  return `https://${APP_NAME}.airbridge.io/?invite_code=${inviteCode}`;
}
