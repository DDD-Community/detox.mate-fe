import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { AppError, getUserErrorMessage, logError, normalizeError } from '../../../api/errors';
import {
  getGetInviteeQueryOptions,
  getGetMyInviteQueryOptions,
} from '../../../api/query-generated/friend';
import { trackEvent } from '../../../lib/analytics';
import { createFriendInviteShareUrl } from '../../../lib/friendInviteShare';

export function useShareFriendInvite() {
  const client = useQueryClient();
  const lock = useRef(false);
  const mounted = useRef(true);
  const [sharing, setSharing] = useState(false);
  const linkOptions = queryOptions({
    // This is an SDK result, separate from the generated invitation HTTP query.
    queryKey: ['friendInviteShareUrl'],
    queryFn: async ({ signal }) => {
      const invite = await client.fetchQuery(getGetMyInviteQueryOptions());
      if (signal.aborted) throw new Error('The authentication session ended.');
      try {
        if (!invite.code?.trim()) {
          throw AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' });
        }
        return await createFriendInviteShareUrl(invite.code);
      } catch (failure) {
        const error = normalizeError(failure);
        if (!signal.aborted) {
          logError(error, { scope: 'api', operation: 'friends.invite.prepare' });
        }
        throw error;
      }
    },
    // The personal invitation code stays fixed for this login session.
    staleTime: Infinity,
  });
  // SDK preparation must not suspend or hide the friends list on failure.
  const link = useQuery(linkOptions);

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
    try {
      trackEvent('Invite Share Button Clicked', { page_name: 'FriendsList' });
    } catch (failure) {
      logError(normalizeError(failure), { scope: 'api', operation: 'logFriendInviteShareClick' });
    }

    const urlPromise = client.fetchQuery(linkOptions);
    const cache = client.getQueryCache();
    const query = cache.find({ queryKey: linkOptions.queryKey, exact: true });
    // Clearing the auth cache invalidates this identity, including same-user re-login.
    const ownsSession = () =>
      mounted.current &&
      query !== undefined &&
      cache.find({ queryKey: linkOptions.queryKey, exact: true }) === query;
    try {
      const url = await urlPromise;
      if (!ownsSession()) return;
      const invite = await client.fetchQuery(getGetMyInviteQueryOptions());
      if (!ownsSession()) return;
      if (!invite.code?.trim()) {
        throw AppError({ type: 'unknown', message: '친구 초대 코드를 받지 못했어요.' });
      }
      // The personal code resolves our own profile through the same invitation API.
      const profile = await client.fetchQuery(getGetInviteeQueryOptions(invite.code));
      if (!ownsSession()) return;

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
      // Dismissal resolves normally; it is not a sharing failure.
      await Share.share(
        Platform.OS === 'ios' ? { message, url } : { message: `${message}\n\n${url}` }
      );
    } catch (failure) {
      if (!ownsSession()) return;
      const error = normalizeError(failure);
      // Preparation owns its failure logging, including background SDK failures.
      if (client.getQueryState(linkOptions.queryKey)?.error !== failure) {
        logError(error, { scope: 'api', operation: 'friends.invite.share' });
      }
      Alert.alert('친구 초대 공유', getUserErrorMessage(error));
    } finally {
      lock.current = false;
      if (mounted.current) setSharing(false);
    }
  };

  return { share, sharing, inviteUrl: link.data, preparing: link.isFetching };
}
