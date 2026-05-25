type MemberInfo = {
  groupMemberId: number;
  groupId: number;
  challengeRecordId: number;
  displayName: string;
};

// userId(number) → MemberInfo 매핑
const _map = new Map<number, MemberInfo>();

export const memberStore = {
  setAll(
    members: Array<{
      userId: number;
      groupMemberId: number;
      challengeRecordId: number;
      displayName: string;
    }>,
    groupId: number
  ) {
    members.forEach((m) =>
      _map.set(m.userId, {
        groupMemberId: m.groupMemberId,
        groupId,
        challengeRecordId: m.challengeRecordId,
        displayName: m.displayName,
      })
    );
  },
  get(userId: number): MemberInfo | undefined {
    return _map.get(userId);
  },
};
