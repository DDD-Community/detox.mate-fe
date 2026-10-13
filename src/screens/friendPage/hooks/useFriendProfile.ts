import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getFriendProfile, type FriendProfileResponse } from '@/api';
import type { AppError } from '@/api/errors/types';
import { selectFriendPreviews } from '../utils/friendPreviews';

// friend-profile 태그는 Orval query 출력에 포함되어 있지 않아 생성된 Axios factory를 queryFn으로 조합한다.
// 친구 변경(요청·수락·삭제)과 함께 무효화될 수 있도록 key를 ['friends'] 아래에 둔다.
export const getFriendProfileQueryOptions = (friendUserId: number) =>
  queryOptions<FriendProfileResponse, AppError>({
    queryKey: ['friends', friendUserId, 'profile'],
    queryFn: () => getFriendProfile().getProfile(friendUserId),
  });

// 서버는 직접 친구가 아니면 403을 돌려주므로 친구 상태일 때만 이 훅을 쓰는 컴포넌트를 렌더한다.
export function useFriendProfile(friendUserId: number) {
  const profile = useSuspenseQuery(getFriendProfileQueryOptions(friendUserId)).data;

  return {
    // 5자 코드이며 영문자는 대문자로 표시한다(친구 정책). 미발급 기존 계정은 null이다.
    userCode: (profile.userCode ?? '').toUpperCase(),
    friends: selectFriendPreviews(profile.friends),
  };
}
