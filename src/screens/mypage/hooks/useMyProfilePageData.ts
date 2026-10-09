import { queryOptions, usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import { getGetFriendsSuspenseQueryOptions, getUser, type MyPageResponse } from '@/api';
import type { AppError } from '@/api/errors/types';
import { pickRecentFriends } from '../utils/profileRules';

// 사용자 태그는 Orval query 출력에 포함되어 있지 않아 기존 Axios factory를 queryFn으로 조합한다.
export const getMyProfileQueryOptions = () =>
  queryOptions<MyPageResponse, AppError>({
    queryKey: ['users', 'me'],
    queryFn: () => getUser().getMe(),
  });

export function useMyProfile() {
  const profile = useSuspenseQuery(getMyProfileQueryOptions()).data;

  return {
    displayName: profile.displayName ?? '',
    profileImageUrl: profile.profileImageUrl ?? null,
    // 5자 코드이며 영문자는 대문자로 표시한다(마이페이지 정책). 미발급 기존 계정은 null이다.
    userCode: (profile.userCode ?? '').toUpperCase(),
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
