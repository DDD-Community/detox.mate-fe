import type { FriendRelationshipStatus } from '@/api';

// 친구 페이지는 조회 API가 없어 진입하는 쪽이 아는 정보를 라우트 파라미터로 받는다.
export type FriendPageRelationship = Exclude<FriendRelationshipStatus, 'SELF'>;

export interface FriendPageParams {
  userId: number;
  displayName: string;
  profileImageUrl: string | null;
  relationship: FriendPageRelationship;
  friendshipId?: number;
  requestId?: number;
}

export type RawFriendPageParams = Partial<
  Record<
    | 'userId'
    | 'displayName'
    | 'profileImageUrl'
    | 'relationshipStatus'
    | 'friendshipId'
    | 'requestId',
    string | string[]
  >
>;

const RELATIONSHIPS: FriendPageRelationship[] = [
  'NONE',
  'PENDING_SENT',
  'PENDING_RECEIVED',
  'FRIEND',
];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const toPositiveId = (value: string | string[] | undefined): number | undefined => {
  const id = Number(first(value));
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

// 사용자 ID나 이름이 없으면 화면을 만들 수 없으므로 null이다. 관계를 모르면 친구로 본다(마이페이지 친구 항목 진입).
export function parseFriendPageParams(raw: RawFriendPageParams): FriendPageParams | null {
  const userId = toPositiveId(raw.userId);
  const displayName = first(raw.displayName)?.trim();
  if (userId === undefined || !displayName) return null;

  const status = first(raw.relationshipStatus) as FriendPageRelationship | undefined;
  return {
    userId,
    displayName,
    profileImageUrl: first(raw.profileImageUrl) || null,
    relationship: status && RELATIONSHIPS.includes(status) ? status : 'FRIEND',
    friendshipId: toPositiveId(raw.friendshipId),
    requestId: toPositiveId(raw.requestId),
  };
}
