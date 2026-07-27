import { useLocalSearchParams } from 'expo-router';

type MyPageSearchParams = {
  memberId?: string;
  friendName?: string;
  friendUserId?: string;
  challengeRecordId?: string;
  groupChallengeId?: string;
  friendGroupId?: string;
  isPoked?: string;
};

export type MyPageParams =
  | { mode: 'me' }
  | {
      mode: 'friend';
      memberId: string;
      friendName?: string;
      friendUserId?: string;
      challengeRecordId?: string;
      groupChallengeId?: string;
      friendGroupId?: string;
      isPoked?: string;
    };

export function useMyPageParams(): MyPageParams {
  const {
    memberId,
    friendName,
    friendUserId,
    challengeRecordId,
    groupChallengeId,
    friendGroupId,
    isPoked,
  } = useLocalSearchParams<MyPageSearchParams>();

  if (!memberId) {
    return { mode: 'me' };
  }

  return {
    mode: 'friend',
    memberId,
    friendName,
    friendUserId,
    challengeRecordId,
    groupChallengeId,
    friendGroupId,
    isPoked,
  };
}
