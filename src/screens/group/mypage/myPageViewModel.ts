import type { GroupMemberProfileResponse, GroupResponse, MyProfileResponse } from '@/api';
import { formatMinutesAsHourMinute } from '@/lib/formatDuration';

interface BuildMyPageViewModelOptions {
  isFriend: boolean;
  friendName?: string;
  profile: MyProfileResponse | null;
  memberProfile: GroupMemberProfileResponse | null;
  friendProfile: GroupMemberProfileResponse | null;
  groups: GroupResponse[];
  profileImageUri: string | null;
  defaultProfileImageObjectKey: string;
}

export function buildMyPageViewModel({
  isFriend,
  friendName,
  profile,
  memberProfile,
  friendProfile,
  groups,
  profileImageUri,
  defaultProfileImageObjectKey,
}: BuildMyPageViewModelOptions) {
  const activeProfile = isFriend ? friendProfile : memberProfile;
  const weekly = activeProfile?.weeklySummary;
  const displayProfileImageUri = isFriend
    ? (friendProfile?.profileImageUrl ?? null)
    : profileImageUri;
  const isDefaultProfileImage =
    displayProfileImageUri?.includes(defaultProfileImageObjectKey) ?? false;

  return {
    displayName: isFriend
      ? (friendProfile?.displayName ?? friendName ?? '친구')
      : (profile?.displayName ?? ''),
    dayCount: activeProfile?.activitySummary?.dayCount ?? 0,
    achievementRate: activeProfile?.activitySummary?.achievementRate ?? 0,
    hasJoinedGroup: groups.length > 0,
    isFriendGoalSet: (friendProfile?.currentGoals?.length ?? 0) > 0,
    weeklyStatus: {
      avgScreenTime: formatMinutesAsHourMinute(weekly?.averageUsedMinutes),
      goalScreenTime: formatMinutesAsHourMinute(weekly?.goalMinutes),
      diffMinutes: weekly?.differenceMinutes ?? 0,
      certifiedDays: weekly?.certifiedDays ?? 0,
      totalVerifyDays: weekly?.totalDays ?? 7,
      achievedDays: weekly?.achievedDays ?? 0,
    },
    joinedGroups: groups.map((item) => ({
      id: item.id,
      name: item.name ?? '',
      members: (item.members ?? []).map((m) => ({
        name: m.displayName ?? '',
        profileImageUrl: m.profileImageUrl ?? null,
      })),
    })),
    daysUntilGoalChange: memberProfile?.goalChangeAvailability?.remainingDays ?? 0,
    displayProfileImageUri,
    hasProfileBackground: Boolean(displayProfileImageUri && !isDefaultProfileImage),
  };
}
