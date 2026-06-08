import { router } from 'expo-router';
import { Airbridge } from 'airbridge-react-native-sdk';

const APP_NAME = 'detoxmate';
const APP_TOKEN = 'de33f6fd010d4db794542d3a0c05b7a4';

export function initAirbridge() {
  const airbridge = Airbridge.createDependency.Airbridge();

  airbridge.deeplinkModule.setOnDeeplinkReceived((deeplink: string) => {
    handleInviteDeeplink(deeplink);
  });
}

function handleInviteDeeplink(deeplink: string) {
  try {
    const url = new URL(deeplink);
    const inviteCode = url.searchParams.get('invite_code');
    if (inviteCode) {
      router.replace({ pathname: '/join', params: { inviteCode } });
    }
  } catch {
    // 파싱 실패 시 무시
  }
}

export function getInviteShareUrl(inviteCode: string): string {
  return `https://${APP_NAME}.airbridge.io/?invite_code=${inviteCode}`;
}
