import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { getAuthenticatedRequestSignal } from '../../../api/client';
import { getUserErrorMessage, logError, normalizeError } from '../../../api/errors';
import { getInvitee, getMyInvite } from '../../../api/query-generated/friend';
import { trackEvent } from '../../../lib/analytics';
import { createFriendInviteShareUrl } from '../../../lib/friendInviteShare';

async function prepareShareContent(signal: AbortSignal) {
  const authSignal = getAuthenticatedRequestSignal();
  const invite = await getMyInvite(signal);
  if (signal.aborted || authSignal.aborted) throw new Error('Invitation preparation canceled.');
  const code = invite.code ?? '';
  let url: string;
  try {
    url = createFriendInviteShareUrl(code);
  } catch (failure) {
    const error = normalizeError(failure);
    if (!signal.aborted && !authSignal.aborted) {
      logError(error, { scope: 'api', operation: 'friends.invite.prepare' });
    }
    throw error;
  }
  const profile = await getInvitee(code, signal);
  if (signal.aborted || authSignal.aborted) throw new Error('Invitation preparation canceled.');
  const name = profile.displayName?.trim() || '친구';
  const email = invite.email?.trim();
  const message = [
    `${name}님에게 친구 요청을 보내 함께 스크린타임을 줄여보세요.`,
    ...(email
      ? [
          '링크가 원활하지 않은 경우, 앱에서 이메일 입력을 통해 친구 요청을 보낼 수 있습니다.',
          `${name} (${email})`,
        ]
      : []),
  ].join('\n\n');
  return { url, message };
}

function logShareClick() {
  try {
    trackEvent('Invite Share Button Clicked', { page_name: 'FriendsList' });
  } catch (failure) {
    logError(normalizeError(failure), { scope: 'api', operation: 'logFriendInviteShareClick' });
  }
}

export function useShareFriendInvite() {
  // Prepare the message and URL together so display and sharing use the same content.
  // Failure must not suspend or hide the friends list.
  const content = useQuery({
    queryKey: ['friendInviteShareUrl'],
    queryFn: ({ signal }) => prepareShareContent(signal),
    staleTime: Infinity,
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
        // Preparation owns link configuration logging; the interceptor owns request logging.
        Alert.alert('친구 초대 공유', getUserErrorMessage(normalizeError(prepared.error)));
        return;
      }
      const { message, url } = prepared.data;
      await Share.share(
        Platform.OS === 'ios' ? { message, url } : { message: `${message}\n\n${url}` }
      );
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
