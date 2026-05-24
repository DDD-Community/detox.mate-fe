import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getGroup } from '../../../api/generated/group/group';
import { getGroupMember } from '../../../api/generated/group-member/group-member';
import type {
  GroupMemberProfileResponse,
  GroupResponse,
  MyProfileResponse,
} from '../../../api/generated/model';
import { getUser } from '../../../api/generated/user/user';
import { getUserUsageGoalTime } from '../../../api/generated/user-usage-goal-time/user-usage-goal-time';
import type { MyPageParams } from './useMyPageParams';

interface UseMyPageDataOptions {
  params: MyPageParams;
  onProfileImageUriChange: (uri: string | null) => void;
}

export function useMyPageData({ params, onProfileImageUriChange }: UseMyPageDataOptions) {
  const isFriend = params.mode === 'friend';
  const memberId = isFriend ? params.memberId : undefined;
  const friendGroupId = isFriend ? params.friendGroupId : undefined;

  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [hasGoalSet, setHasGoalSet] = useState(false);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [memberProfile, setMemberProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [friendProfile, setFriendProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 첫 진입 시에만 ActivityIndicator를 노출. 화면 복귀 시(refresh)는 백그라운드로 갱신.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          if (isFriend) {
            const groupIdNum = friendGroupId ? Number(friendGroupId) : NaN;
            const memberIdNum = memberId ? Number(memberId) : NaN;
            if (Number.isFinite(groupIdNum) && Number.isFinite(memberIdNum)) {
              const data = await getGroupMember().getGroupMemberProfile(groupIdNum, memberIdNum);
              if (cancelled) return;
              setFriendProfile(data);
            }
            return;
          }

          const [me, goalsResponse, myGroups] = await Promise.all([
            getUser().getMe(),
            getUserUsageGoalTime().getCurrentGoalTimes(),
            getGroup().getMyGroups(),
          ]);
          if (cancelled) return;

          setProfile(me);
          onProfileImageUriChange(me.profileImageUrl ?? null);
          setHasGoalSet((goalsResponse.goals?.length ?? 0) > 0);

          const groupIds = (myGroups ?? [])
            .map((item) => item.id)
            .filter((id): id is number => id != null);
          const groupDetails = await Promise.all(
            groupIds.map((groupId) => getGroup().getGroup(groupId))
          );
          if (cancelled) return;
          setGroups(groupDetails);

          const firstGroup = groupDetails[0];
          if (!firstGroup?.id || !me.id) {
            setMemberProfile(null);
            return;
          }

          const myMember = firstGroup.members?.find((m) => m.userId === me.id);
          if (!myMember?.id) {
            setMemberProfile(null);
            return;
          }

          const profileData = await getGroupMember().getGroupMemberProfile(
            firstGroup.id,
            myMember.id
          );
          if (cancelled) return;
          setMemberProfile(profileData);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [friendGroupId, isFriend, memberId, onProfileImageUriChange])
  );

  return {
    profile,
    hasGoalSet,
    groups,
    memberProfile,
    friendProfile,
    isLoading,
  };
}
