import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getGroup } from '../../../api/generated/group/group';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';
import { LeaveGroupAlert } from './LeaveGroupAlert';

const { brown, gray, green } = primitiveColors;

const ICONS = {
  caretLeft: require('../../../../assets/icons/regular/icon_rg_CaretLeft.png'),
  shareFat: require('../../../../assets/icons/regular/icon_rg_ShareFat.png'),
  info: require('../../../../assets/icons/regular/icon_rg_Info.png'),
} as const;

const TURTLE_AVATAR = require('../../../../assets/turtle-hi.png');

interface Member {
  id: string;
  name: string;
  profileImageUrl?: string;
  isMe?: boolean;
}

export default function GroupInfoScreen() {
  // TODO: useLocalSearchParams로 groupId 받기
  const groupId = 1;
  // TODO: GET /groups/{groupId} 응답으로 채우기
  const groupName = '{그룹명}';
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

  const handleInvite = () => {
    // TODO: 초대 코드 공유 (Share API + GET /groups/{groupId} 응답의 inviteCode)
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
      // TODO: 마이페이지 진입 시 그룹 상태 재조회 — GET /me/groups
      router.back();
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

        <Pressable onPress={handleInvite} style={styles.inviteButton}>
          <Image source={ICONS.shareFat} style={styles.inviteIconLeft} resizeMode="contain" />
          <Text style={styles.inviteText}>친구 초대하기</Text>
          <Image source={ICONS.info} style={styles.inviteIconRight} resizeMode="contain" />
        </Pressable>

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
                    params: { memberId: m.id, friendName: m.name },
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
  inviteButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: gray[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[12],
    marginTop: spacing[4],
  },
  inviteIconLeft: {
    width: 16,
    height: 16,
    tintColor: green[300],
  },
  inviteIconRight: {
    width: 16,
    height: 16,
    tintColor: green[300],
  },
  inviteText: {
    ...typography.primary.body2B,
    color: green[300],
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
