import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import { getGetFriendsSuspenseQueryOptions } from '@/api';
import { getMyProfileQueryOptions } from '@/api/userQueries';
import { pickRecentFriends } from '../utils/profileRules';

export function useMyProfile() {
  const profile = useSuspenseQuery(getMyProfileQueryOptions()).data;

  return {
    displayName: profile.displayName,
    profileImageUrl: profile.profileImageUrl,
    userCode: profile.userCode,
  };
}

export function useMyProfilePageData() {
  // 두 조회는 서로 독립이므로 먼저 함께 시작해 읽는 순서대로 직렬 요청이 되지 않게 한다.
  const profileOptions = getMyProfileQueryOptions();
  const friendsOptions = getGetFriendsSuspenseQueryOptions();
  usePrefetchQuery(profileOptions);
  usePrefetchQuery(friendsOptions);
  const me = useMyProfile();
  const friends = useSuspenseQuery(friendsOptions).data;

  return { ...me, recentFriends: pickRecentFriends(friends) };
}
