import { Airbridge, AirbridgeTrackingLinkOption } from 'airbridge-react-native-sdk';

import { AppError } from '../api/errors/normalizeError';

// Native SDK calls may return without invoking either callback when unavailable.
const LINK_CREATION_TIMEOUT_MS = 15_000;
const BRAND_IMAGE_URL =
  'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/fc/61/f5/fc61f526-ec05-0783-0e2e-ec183d7c164a/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg';

export function createFriendInviteShareUrl(code: string): Promise<string> {
  if (!code.trim()) {
    return Promise.reject(
      AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' })
    );
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(AppError({ type: 'timeout', message: '친구 초대 링크 생성 시간이 초과됐어요.' }));
    }, LINK_CREATION_TIMEOUT_MS);

    const fail = () => {
      clearTimeout(timer);
      // SDK errors can contain the invite URL. Keep codes and personal data out of logs.
      reject(AppError({ type: 'unknown', message: '친구 초대 링크를 만들지 못했어요.' }));
    };

    try {
      Airbridge.createTrackingLink(
        'friend_invite',
        {
          [AirbridgeTrackingLinkOption.DEEPLINK_URL]: `detoxmate://friend-invite?code=${encodeURIComponent(code)}`,
          [AirbridgeTrackingLinkOption.DEEPLINK_STOPOVER]: false,
          [AirbridgeTrackingLinkOption.FALLBACK_IOS]: 'store',
          [AirbridgeTrackingLinkOption.FALLBACK_ANDROID]: 'store',
          [AirbridgeTrackingLinkOption.OGTAG_TITLE]: '디톡스 메이트 - 친구 초대',
          [AirbridgeTrackingLinkOption.OGTAG_DESCRIPTION]: '친구와 함께하는 스크린타임 챌린지',
          [AirbridgeTrackingLinkOption.OGTAG_IMAGE_URL]: BRAND_IMAGE_URL,
        },
        (link) => {
          if (!link.shortURL?.trim()) {
            fail();
            return;
          }
          clearTimeout(timer);
          resolve(link.shortURL);
        },
        fail
      );
    } catch {
      fail();
    }
  });
}
