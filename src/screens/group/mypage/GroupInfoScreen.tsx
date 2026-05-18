import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getGroup } from '../../../api/generated/group/group';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';
import { LeaveGroupAlert } from './LeaveGroupAlert';

const { brown, gray } = primitiveColors;

const ICONS = {
  caretLeft: require('../../../../assets/icons/regular/icon_rg_CaretLeft.png'),
  copy: require('../../../../assets/onboarding-copy.png'),
  shareBlack: require('../../../../assets/onboarding-share-black.png'),
} as const;

const TURTLE_AVATAR = require('../../../../assets/turtle-hi.png');

interface Member {
  id: string;
  name: string;
  profileImageUrl?: string;
  isMe?: boolean;
  // 콕 찌르기에 필요한 추가 정보 (API 연동 시 채워짐)
  userId?: number;
  challengeRecordId?: number;
  hasGoalSet?: boolean;
}

export default function GroupInfoScreen() {
  // TODO: useLocalSearchParams로 groupId 받기
  const groupId = 1;
  // TODO: GET /groups/{groupId} 응답으로 채우기
  const groupName = '{그룹명}';
  const inviteCode = 'A1C3E';
  const members: Member[] = [
    { id: '1', name: '나', isMe: true },
    { id: '2', name: '서연' },
    { id: '3', name: '지민' },
  ];

  const [isLeaveAlertOpen, setIsLeaveAlertOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleCopyInviteCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    // TODO: 토스트 "초대 코드가 복사되었어요"
  };

  const handleShareInviteCode = async () => {
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
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      const userId = await SecureStore.getItemAsync('currentUserId');
      await getGroup().leaveGroup(groupId, {
        currentUser: { id: userId ? Number(userId) : undefined },
      });
      setIsLeaveAlertOpen(false);
      // 그룹 탈퇴 성공 → 홈(그룹 없음 상태)으로 이동
      router.replace('/home');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Image source={ICONS.caretLeft} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupName}
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <Text style={styles.memberCount}>멤버 {members.length}명</Text>

        <View style={styles.inviteCard}>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>초대 코드</Text>
            <Text style={styles.codeText}>{inviteCode}</Text>
            <Pressable onPress={handleCopyInviteCode} hitSlop={8}>
              <Image source={ICONS.copy} style={styles.copyIcon} resizeMode="contain" />
            </Pressable>
          </View>
          <Pressable onPress={handleShareInviteCode} style={styles.shareButton}>
            <Image source={ICONS.shareBlack} style={styles.shareIcon} resizeMode="contain" />
            <Text style={styles.shareText}>친구에게 공유하기</Text>
          </Pressable>
        </View>

        <View style={styles.memberList}>
          {members.map((m) => {
            const content = (
              <>
                <Image
                  source={m.profileImageUrl ? { uri: m.profileImageUrl } : TURTLE_AVATAR}
                  style={styles.memberAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {m.name}
                </Text>
              </>
            );

            if (m.isMe) {
              return (
                <View key={m.id} style={styles.memberCard}>
                  {content}
                </View>
              );
            }

            return (
              <Pressable
                key={m.id}
                style={styles.memberCard}
                onPress={() =>
                  router.push({
                    pathname: '/(group)/mypage',
                    params: {
                      memberId: m.id,
                      friendName: m.name,
                      friendUserId: m.userId,
                      challengeRecordId: m.challengeRecordId,
                      friendHasGoalSet: m.hasGoalSet ? 'true' : 'false',
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
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
    flex: 1,
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
  copyIcon: {
    width: 20,
    height: 20,
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
  shareIcon: {
    width: 18,
    height: 18,
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
