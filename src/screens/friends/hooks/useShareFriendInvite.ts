import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { getAuthenticatedRequestSignal } from '../../../api/client';
import { AppError, getUserErrorMessage, logError, normalizeError } from '../../../api/errors';
import { getMyInvite } from '../../../api/query-generated/friend';
import { trackEvent } from '../../../lib/analytics';
import { createFriendInviteShareUrl } from '../../../lib/friendInviteShare';

async function prepareShareContent(signal: AbortSignal) {
  const authSignal = getAuthenticatedRequestSignal();
  const invite = await getMyInvite(signal);
  if (signal.aborted || authSignal.aborted) throw new Error('Invitation preparation canceled.');
  let url: string;
  try {
    if (!invite.code?.trim()) {
      throw AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' });
    }
    url = await createFriendInviteShareUrl(invite.code);
  } catch (failure) {
    const error = normalizeError(failure);
    if (!signal.aborted && !authSignal.aborted) {
      logError(error, { scope: 'api', operation: 'friends.invite.prepare' });
    }
    throw error;
  }
  if (signal.aborted || authSignal.aborted) throw new Error('Invitation preparation canceled.');
  const message = [
    '디톡스메이트에서 함께 스크린타임을 줄여봐요.',
    `초대 링크: ${url}`,
    `초대 코드: ${invite.userCode}`,
    '링크가 열리지 않으면 친구 목록 검색창에 초대 코드를 입력해주세요.',
  ].join('\n');
  return { url, message };
}

function logShareClick() {
  try {
    trackEvent('Invite Share Button Clicked', { page_name: 'FriendsList' });
  } catch (failure) {
    logError(normalizeError(failure), { scope: 'api', operation: 'logFriendInviteShareClick' });
  }
}

interface UseShareFriendInviteOptions {
  // 초대 링크 생성은 Airbridge 트래킹 링크를 새로 만들고 앱당 개수 제한이 있다.
  // URL을 화면에 보여주지 않는 곳은 false로 두어 공유를 누를 때만 만든다.
  prepareOnMount?: boolean;
}

export function useShareFriendInvite({ prepareOnMount = true }: UseShareFriendInviteOptions = {}) {
  // SDK preparation includes the message so display and sharing use the same prepared content.
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
    logShareClick();
    const signal = getAuthenticatedRequestSignal();
    const active = () => mounted.current && !signal.aborted;
    try {
      const prepared = content.data ? content : await content.refetch();
      if (!active()) return;
      if (!prepared.data) {
        // Preparation owns SDK logging and the HTTP interceptor owns request logging.
        Alert.alert('친구 초대 공유', getUserErrorMessage(normalizeError(prepared.error)));
        return;
      }
      const { message, url } = prepared.data;
      await Share.share(Platform.OS === 'ios' ? { message, url } : { message });
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

  return { share, sharing, inviteUrl: content.data?.url, preparing: content.isFetching };
}
