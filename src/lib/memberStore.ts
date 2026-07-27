type MemberInfo = {
  groupMemberId: number;
  groupId: number;
  challengeRecordId?: number;
  displayName: string;
  profileImageUrl?: string;
};

// userId(number) → MemberInfo 매핑
const _map = new Map<number, MemberInfo>();

export const memberStore = {
  setAll(
    members: Array<{
      userId: number;
      groupMemberId: number;
      challengeRecordId?: number;
      displayName: string;
      profileImageUrl?: string;
    }>,
    groupId: number
  ) {
    members.forEach((m) =>
      _map.set(m.userId, {
        groupMemberId: m.groupMemberId,
        groupId,
        challengeRecordId: m.challengeRecordId,
        displayName: m.displayName,
        profileImageUrl: m.profileImageUrl,
      })
    );
  },
  get(userId: number): MemberInfo | undefined {
    return _map.get(userId);
  },
  getByDisplayName(displayName: string): MemberInfo | undefined {
    for (const info of _map.values()) {
      if (info.displayName === displayName) return info;
    }
    return undefined;
  },
};
