import type { FriendResponse } from '@/api';

interface FriendPageExtras {
  // 친구의 초대 코드. 조회 API가 아직 없어 undefined이면 코드 줄을 숨긴다.
  inviteCode?: string;
  // 친구의 친구 목록(최근 순 최대 10명). 조회 API가 아직 없어 undefined이면 섹션을 숨긴다.
  friends?: FriendResponse[];
}

// TODO(API): 서버에 친구 프로필 조회가 생기면 이 훅만 실제 조회로 바꾼다.
// 없는 데이터를 가짜로 채우지 않기 위해 지금은 아무것도 돌려주지 않는다.
export function useFriendPageExtras(_userId: number): FriendPageExtras {
  return {};
}
