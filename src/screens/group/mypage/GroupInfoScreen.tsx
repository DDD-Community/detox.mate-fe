import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFeed, getGroup, type GroupMemberResponse } from '@/api';
import { Icon } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { LeaveGroupAlert } from './LeaveGroupAlert';

const { brown, gray } = primitiveColors;

const DEFAULT_AVATAR = require('../../../../assets/basic-profile-turtle-hi.png');

export default function GroupInfoScreen() {
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId?: string }>();

  const [groupId, setGroupId] = useState<number | null>(groupIdParam ? Number(groupIdParam) : null);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  // userId → 오늘의 challengeRecordId 매핑 (콕 찌르기에 필요)
  const [challengeRecordIdByUserId, setChallengeRecordIdByUserId] = useState<
    Record<number, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const [isLeaveAlertOpen, setIsLeaveAlertOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const getCurrentUserId = async () => {
    const userIdStr = await SecureStore.getItemAsync('currentUserId');
    return userIdStr ? Number(userIdStr) : null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentUserId = await getCurrentUserId();
        setMyUserId(currentUserId);

        let targetId = groupId;
        if (targetId == null) {
          const myGroups = await getGroup().getMyGroups();
          if (cancelled) return;
          targetId = myGroups?.[0]?.id ?? null;
          if (targetId != null) setGroupId(targetId);
        }
        if (targetId == null) return;

        const data = await getGroup().getGroup(targetId);
        if (cancelled) return;
        setGroupName(data.name ?? '');
        setInviteCode(data.inviteCode ?? '');
        setMembers(data.members ?? []);

        const groupChallengeId = data.currentChallenge?.id;
        if (groupChallengeId != null) {
          const today = await getFeed().getTodayChallengeRecords(groupChallengeId);
          if (cancelled) return;
          const map: Record<number, number> = {};
          for (const m of today.members ?? []) {
            if (m.userId != null && m.challengeRecordId != null) {
              map[m.userId] = m.challengeRecordId;
            }
          }
          setChallengeRecordIdByUserId(map);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    // TODO: 토스트 "초대 코드가 복사되었어요"
  };

  const handleShareInviteCode = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${inviteCode}`,
    });
  };

  const handleOpenLeaveAlert = () => {
    setIsLeaveAlertOpen(true);
  };

  const handleCloseLeaveAlert = () => {
    if (isLeaving) return;
    setIsLeaveAlertOpen(false);
  };

  const handleConfirmLeave = async () => {
    if (isLeaving || groupId == null) return;
    setIsLeaving(true);
    try {
      await getGroup().leaveGroup(groupId);
      setIsLeaveAlertOpen(false);
      // 그룹 탈퇴 성공 → 그룹 없음 화면으로 이동
      router.replace('/(group)/home');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Icon name="caretLeft" size={24} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupName}
          </Text>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.memberCount}>멤버 {members.length}명</Text>

          <View style={styles.inviteCard}>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>초대 코드</Text>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <Pressable onPress={handleCopyInviteCode} hitSlop={8}>
                <Icon name="copy" size={20} color={gray[800]} />
              </Pressable>
            </View>
            <Pressable onPress={handleShareInviteCode} style={styles.shareButton}>
              <Icon name="shareFat" size={18} color={gray[800]} />
              <Text style={styles.shareText}>친구에게 공유하기</Text>
            </Pressable>
          </View>

          <View style={styles.memberList}>
            {members.map((m) => {
              const isMe = myUserId != null && m.userId === myUserId;
              const displayName = m.displayName ?? '';
              const content = (
                <>
                  <Image
                    source={m.profileImageUrl ? { uri: m.profileImageUrl } : DEFAULT_AVATAR}
                    style={styles.memberAvatar}
                    resizeMode="cover"
                  />
                  <Text style={styles.memberName} numberOfLines={1}>
                    {isMe ? '나' : displayName}
                  </Text>
                </>
              );

              if (isMe) {
                return (
                  <View key={m.id} style={styles.memberCard}>
                    {content}
                  </View>
                );
              }

              const challengeRecordId =
                m.userId != null ? challengeRecordIdByUserId[m.userId] : undefined;
              return (
                <Pressable
                  key={m.id}
                  style={styles.memberCard}
                  onPress={() =>
                    router.push({
                      pathname: '/(group)/mypage',
                      params: {
                        memberId: m.id != null ? String(m.id) : '',
                        friendName: displayName,
                        friendUserId: m.userId != null ? String(m.userId) : '',
                        friendGroupId: groupId != null ? String(groupId) : '',
                        challengeRecordId:
                          challengeRecordId != null ? String(challengeRecordId) : '',
                      },
                    })
                  }
                >
                  {content}
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleOpenLeaveAlert} style={styles.leaveCard}>
            <Text style={styles.leaveText}>그룹 나가기</Text>
          </Pressable>
        </View>
      )}

      <LeaveGroupAlert
        visible={isLeaveAlertOpen}
        onClose={handleCloseLeaveAlert}
        onConfirm={handleConfirmLeave}
        loading={isLeaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
    gap: spacing[8],
  },
  memberCount: {
    ...typography.primary.body1B,
    color: gray[500],
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius[16],
    padding: spacing[16],
    gap: spacing[12],
    marginTop: spacing[4],
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
    paddingVertical: spacing[8],
  },
  codeLabel: {
    ...typography.primary.body2R,
    color: gray[500],
  },
  codeText: {
    ...typography.primary.title1B,
    color: gray[900],
    letterSpacing: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    height: 44,
    borderRadius: radius[12],
    backgroundColor: gray[50],
  },
  shareText: {
    ...typography.primary.body2B,
    color: gray[800],
  },
  memberList: {
    gap: spacing[12],
    marginTop: spacing[8],
  },
  memberCard: {
    height: 60,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: gray[100],
  },
  memberName: {
    ...typography.primary.body1B,
    color: gray[800],
    flex: 1,
  },
  leaveCard: {
    height: 50,
    borderRadius: radius[12],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[12],
    justifyContent: 'center',
    marginTop: spacing[20],
  },
  leaveText: {
    ...typography.primary.body1R,
    color: gray[800],
  },
});
