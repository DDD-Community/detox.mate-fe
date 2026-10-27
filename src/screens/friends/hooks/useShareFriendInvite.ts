import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, Share } from 'react-native';

import { getAuthenticatedRequestSignal } from '../../../api/client';
import { AppError, getUserErrorMessage, logError, normalizeError } from '../../../api/errors';
import { getMyInvite } from '../../../api/query-generated/friend';
import { getFriendInviteShareUrl } from '../../../lib/airbridge';
import { trackEvent } from '../../../lib/analytics';

async function prepareShareContent(signal: AbortSignal) {
  const authSignal = getAuthenticatedRequestSignal();
  const invite = await getMyInvite(signal);
  if (signal.aborted || authSignal.aborted) throw new Error('Invitation preparation canceled.');
  if (!invite.userCode.trim()) {
    const error = AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' });
    if (!signal.aborted && !authSignal.aborted) {
      logError(error, { scope: 'api', operation: 'friends.invite.prepare' });
    }
    throw error;
  }
  // Airbridge 링크를 같이 보낸다. 링크를 못 여는 환경에서는 코드를 검색창에 직접 입력하면 된다.
  const message = [
    '디톡스메이트에서 함께 스크린타임을 줄여봐요.',
    `초대 코드: ${invite.userCode}`,
    getFriendInviteShareUrl(invite.userCode),
    '링크가 열리지 않으면 친구 목록 검색창에 초대 코드를 입력해주세요.',
  ].join('\n');
  // 카드에는 Figma의 `detoxmate/{invite_code}` 형태로 보여준다.
  return { message, label: `detoxmate/${invite.userCode}` };
}

function logShareClick(pageName: string) {
  try {
    trackEvent('Invite Share Button Clicked', { page_name: pageName });
  } catch (failure) {
    logError(normalizeError(failure), { scope: 'api', operation: 'logFriendInviteShareClick' });
  }
}

interface UseShareFriendInviteOptions {
  // URL을 표시하지 않는 화면은 공유를 누를 때만 초대 정보를 조회한다.
  prepareOnMount?: boolean;
  pageName?: string;
}

export function useShareFriendInvite({
  prepareOnMount = true,
  pageName = 'FriendsList',
}: UseShareFriendInviteOptions = {}) {
  // Prepare the message and URL together so display and sharing use the same content.
  // Failure must not suspend or hide the friends list.
  const content = useQuery({
    queryKey: ['friendInviteShareUrl'],
    queryFn: ({ signal }) => prepareShareContent(signal),
    staleTime: Infinity,
    enabled: prepareOnMount,
  });
  const lock = useRef(false);
  const mounted = useRef(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const share = async () => {
    if (lock.current) return;
    lock.current = true;
    setSharing(true);
    logShareClick(pageName);
    const signal = getAuthenticatedRequestSignal();
    const active = () => mounted.current && !signal.aborted;
    try {
      const prepared = content.data ? content : await content.refetch();
      if (!active()) return;
      if (!prepared.data) {
        // Preparation owns link configuration logging; the interceptor owns request logging.
        Alert.alert('친구 초대 공유', getUserErrorMessage(normalizeError(prepared.error)));
        return;
      }
      await Share.share({ message: prepared.data.message });
    } catch (failure) {
      if (!active()) return;
      const error = normalizeError(failure);
      logError(error, { scope: 'api', operation: 'friends.invite.share' });
      Alert.alert('친구 초대 공유', getUserErrorMessage(error));
    } finally {
      lock.current = false;
      if (mounted.current) setSharing(false);
    }
  };

  return {
    share,
    sharing,
    inviteLabel: content.data?.label,
    preparing: content.isFetching,
  };
}
