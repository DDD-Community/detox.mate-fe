import { router } from 'expo-router';
import { Image, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { brown, gray } = primitiveColors;

const ICONS = {
  caretLeft: require('../../../assets/icons/regular/icon_rg_CaretLeft.png'),
} as const;

const DEFAULT_AVATAR = require('../../../assets/turtle-hi.png');
const EMPTY_IMAGE = require('../../../assets/onboarding-none-feed.png');

interface NotificationItem {
  id: string;
  avatarUrl?: string;
  message: string;
  timeLabel: string;
}

interface NotificationSection {
  title: string;
  data: NotificationItem[];
}

// TODO: 백엔드 알림 API 추가 후 교체
//   GET /me/notifications?cursor=...&limit=20
//     → { items: NotificationItem[], nextCursor?: string, ... }
//   PATCH /me/notifications/{id}/read
//   PATCH /me/notifications/read-all
const MOCK_SECTIONS: NotificationSection[] = [
  {
    title: '오늘',
    data: [
      {
        id: 'n-1',
        message: '민준님이 댓글을 남겼어요:\n오 대박 나도 오늘 해야하는데 ㅋㅋ',
        timeLabel: '방금 전',
      },
      {
        id: 'n-2',
        message: '지민님이 댓글을 남겼어요:\n왜 아직도 안함?',
        timeLabel: '방금 전',
      },
      {
        id: 'n-3',
        message: '지민님이 회원님의 인증에 반응했어요.',
        timeLabel: '5분 전',
      },
      {
        id: 'n-4',
        message: '태희님이 오늘 인증을 완료했어요.',
        timeLabel: '32분 전',
      },
      {
        id: 'n-5',
        message: '수빈님이 콕 찔렀어요 👉 오늘 인증 잊지 마세요!',
        timeLabel: '3시간 전',
      },
    ],
  },
  {
    title: '어제',
    data: [
      {
        id: 'n-6',
        message: '새 멤버 예린님이 수능 D-100 그룹에 합류했어요 🎉',
        timeLabel: '어제',
      },
    ],
  },
  {
    title: '3일 전',
    data: [
      {
        id: 'n-7',
        message: '새 멤버 예린님이 수능 D-100 그룹에 합류했어요 🎉',
        timeLabel: '어제',
      },
      {
        id: 'n-8',
        message: '새 멤버 예린님이 수능 D-100 그룹에 합류했어요 🎉',
        timeLabel: '어제',
      },
    ],
  },
];

export default function NotificationListScreen() {
  // TODO: API 응답으로 교체. 비어 있으면 빈 상태 렌더.
  const sections = MOCK_SECTIONS;
  const isEmpty = sections.every((s) => s.data.length === 0);

  const handleBack = () => {
    router.back();
  };

  const handlePressItem = (_item: NotificationItem) => {
    // TODO: 알림 종류별 라우팅 (댓글→해당 피드, 반응→피드, 그룹 가입→그룹 정보 등)
    //       + PATCH /me/notifications/{id}/read 호출
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Image source={ICONS.caretLeft} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>알림</Text>
        </View>
      </SafeAreaView>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <Image source={EMPTY_IMAGE} style={styles.emptyImage} resizeMode="contain" />
          <Text style={styles.emptyText}>아직 알림이 없어요</Text>
        </View>
      ) : (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePressItem(item)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Image
              source={item.avatarUrl ? { uri: item.avatarUrl } : DEFAULT_AVATAR}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.rowBody}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.timeLabel}>{item.timeLabel}</Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
      )}
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
  },
  listContent: {
    paddingBottom: spacing[40],
  },
  sectionHeader: {
    height: 40,
    paddingHorizontal: spacing[16],
    justifyContent: 'center',
    backgroundColor: brown[50],
  },
  sectionHeaderText: {
    ...typography.accent.body2,
    color: gray[800],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
  },
  rowPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: gray[100],
  },
  rowBody: {
    flex: 1,
    gap: spacing[4],
  },
  message: {
    ...typography.primary.body2B,
    color: gray[800],
  },
  timeLabel: {
    ...typography.primary.body3R,
    color: gray[400],
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
  },
  emptyImage: {
    width: 87,
    height: 88,
  },
  emptyText: {
    ...typography.accent.body2,
    color: gray[400],
    textAlign: 'center',
  },
});
