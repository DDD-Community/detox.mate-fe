import { useLocalSearchParams } from 'expo-router';

type MyPageSearchParams = {
  memberId?: string;
  friendName?: string;
  friendUserId?: string;
  challengeRecordId?: string;
  friendGroupId?: string;
};

export type MyPageParams =
  | { mode: 'me' }
  | {
      mode: 'friend';
      memberId: string;
      friendName?: string;
      friendUserId?: string;
      challengeRecordId?: string;
      friendGroupId?: string;
    };

export function useMyPageParams(): MyPageParams {
  const { memberId, friendName, friendUserId, challengeRecordId, friendGroupId } =
    useLocalSearchParams<MyPageSearchParams>();

  if (!memberId) {
    return { mode: 'me' };
  }

  return {
    mode: 'friend',
    memberId,
    friendName,
    friendUserId,
    challengeRecordId,
    friendGroupId,
  };
}
