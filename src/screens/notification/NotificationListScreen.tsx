import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  MemberResponse,
  NotificationHistoryItemResponse,
  NotificationHistoryListResponse,
  NotificationNavigationResponse,
} from '../../api/generated/model';
import { CurrentUsageGoalTimeResponseUsageGoalType } from '../../api/generated/model';
import { getFeed } from '../../api/generated/feed/feed';
import { getGroup } from '../../api/generated/group/group';
import { getNotificationHistory } from '../../api/generated/notification-history/notification-history';
import { getUserUsageGoalTime } from '../../api/generated/user-usage-goal-time/user-usage-goal-time';
import { HeaderAction, Icon, Toast, useToastVisibility } from '../../components';
import { memberStore } from '../../lib/memberStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from '../feed/ActionGuideBanner';
import type { FeedItem } from '../feed/FeedCard';

const { brown, gray } = primitiveColors;

const DEFAULT_AVATAR = require('../../../assets/turtle-hi.png');
const EMPTY_IMAGE = require('../../../assets/onboarding-none-feed.png');

interface NotificationSection {
  title: string;
  data: NotificationItem[];
}

type NotificationItem = NotificationHistoryItemResponse & {
  senderUserId?: number | null;
  senderProfileImageUrl?: string | null;
};

type NotificationKind = 'comment' | 'reaction' | 'verified' | 'poke' | 'newMember' | 'unknown';

const formatRelativeTime = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  return `${diffDay}일 전`;
};

const formatMessage = (item: NotificationHistoryItemResponse): string => {
  if (item.title && item.message) return `${item.title}\n${item.message}`;
  return item.title ?? item.message ?? '';
};

// "강슬빈님이 댓글을 남겼습니다" 형태 메시지에서 발신자 이름 추출
const extractSenderName = (message?: string): string | undefined => {
  if (!message) return undefined;
  const match = message.match(/^(.+?)님이|^(.+?)님께서/);
  return match?.[1] ?? match?.[2];
};

const getSenderAvatarSource = (item: NotificationItem): number | { uri: string } => {
  if (item.senderProfileImageUrl) return { uri: item.senderProfileImageUrl };
  const name = extractSenderName(item.message);
  const profileImageUrl = name ? memberStore.getByDisplayName(name)?.profileImageUrl : undefined;
  return profileImageUrl ? { uri: profileImageUrl } : DEFAULT_AVATAR;
};

const TOAST_DURATION_MS = 2500;
const DEFAULT_NAVIGATION_ERROR_MESSAGE = '이동할 수 없는 알림이에요';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const getNotificationKind = (item: NotificationItem): NotificationKind => {
  const text = `${item.title ?? ''} ${item.message ?? ''}`;
  if (/새\s*멤버|합류|가입/.test(text)) return 'newMember';
  if (/콕|찌르|재촉/.test(text)) return 'poke';
  if (/댓글/.test(text)) return 'comment';
  if (/반응/.test(text)) return 'reaction';
  if (/인증\s*업로드|인증\s*완료|인증을\s*업로드|인증을\s*완료/.test(text)) {
    return 'verified';
  }
  return 'unknown';
};

const isPreVerificationComment = (item: NotificationItem): boolean => {
  const text = `${item.title ?? ''} ${item.message ?? ''} ${item.sourceType ?? ''}`;
  return /인증\s*전|PRE[_-]?VERIFICATION|BEFORE[_-]?VERIFICATION/i.test(text);
};

const isCreatedToday = (isoDate: string): boolean => {
  const created = new Date(isoDate);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
};

const formatMinutes = (minutes: number | null | undefined): string | undefined => {
  if (minutes == null) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const formatMinutesAsHHMM = (minutes: number | null | undefined): string | undefined => {
  if (minutes == null) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getGoalState = async (): Promise<GoalState> => {
  try {
    const response = await getUserUsageGoalTime().getCurrentGoalTimes();
    const total = response.goals?.find(
      (g) => g.usageGoalType === CurrentUsageGoalTimeResponseUsageGoalType.TOTAL_USAGE
    );
    if (!total) return 'notSet';
    return total.createdAt && isCreatedToday(total.createdAt) ? 'setWaiting' : 'authReady';
  } catch {
    return 'authReady';
  }
};

const pushFeed = (groupChallengeId?: number, challengeRecordId?: number) => {
  router.push({
    pathname: '/(feed)/home',
    params: {
      ...(isFiniteNumber(groupChallengeId) ? { groupChallengeId: String(groupChallengeId) } : {}),
      ...(isFiniteNumber(challengeRecordId)
        ? { challengeRecordId: String(challengeRecordId) }
        : {}),
    },
  });
};

const mapMemberToFeedItem = (member: MemberResponse): FeedItem => {
  const isVerified = member.activityRecord != null;
  const isGoalAchieved = member.activityRecord?.allAchieved === true;
  const totalUsage = member.activityRecord?.details?.find((d) => d.usageGoalType === 'TOTAL_USAGE');
  const totalGoal = member.goals?.find((goal) => goal.usageGoalType === 'TOTAL_USAGE');

  return {
    id: String(member.userId ?? ''),
    groupChallengeParticipantId: member.groupChallengeParticipantId,
    challengeRecordId: member.challengeRecordId,
    name: member.displayName ?? '',
    isMe: member.isMe === true,
    avatarSource: member.profileImageUrl ? { uri: member.profileImageUrl } : DEFAULT_AVATAR,
    commentCount: member.commentCount ?? 0,
    reactionCount: member.reactionCount ?? 0,
    pokeCount: member.pokeCount ?? 0,
    reactions: [],
    pokes: [],
    isVerified,
    isGoalAchieved: isVerified ? isGoalAchieved : undefined,
    photoSource:
      isGoalAchieved && member.activityRecord?.activityImageUrl
        ? { uri: member.activityRecord.activityImageUrl }
        : undefined,
    postText: isGoalAchieved ? (member.activityRecord?.reflectionText ?? undefined) : undefined,
    retroText:
      isVerified && !isGoalAchieved
        ? (member.activityRecord?.reflectionText ?? undefined)
        : undefined,
    screenTime: formatMinutes(totalUsage?.usedMinutes),
    goal: formatMinutesAsHHMM(totalGoal?.goalMinutes),
    verifiedTimeAgo:
      isVerified && member.activityRecord?.submittedAt
        ? formatRelativeTime(member.activityRecord.submittedAt)
        : undefined,
  };
};

const cacheFeedMembers = (members: MemberResponse[] | undefined, groupId?: number) => {
  if (!members || !isFiniteNumber(groupId)) return;
  memberStore.setAll(
    members
      .filter((m) => isFiniteNumber(m.userId))
      .map((m) => ({
        userId: m.userId as number,
        groupMemberId: m.groupMemberId ?? 0,
        challengeRecordId: m.challengeRecordId ?? 0,
        displayName: m.displayName ?? '',
        profileImageUrl: m.profileImageUrl,
      })),
    groupId
  );
};

const pushPostDetail = async (
  groupChallengeId: number,
  member: MemberResponse,
  groupId?: number
): Promise<boolean> => {
  if (!member.challengeRecordId) return false;

  const goalState = await getGoalState();
  router.push({
    pathname: '/(feed)/post-detail',
    params: {
      item: JSON.stringify(mapMemberToFeedItem(member)),
      goalState,
      isPoked: member.isPoked ? '1' : '0',
      myReaction: '',
      groupChallengeId: String(groupChallengeId),
      ...(isFiniteNumber(groupId) ? { groupId: String(groupId) } : {}),
    },
  });
  return true;
};

const routePostDetail = async (
  groupChallengeId?: number,
  predicate?: (member: MemberResponse) => boolean
): Promise<boolean> => {
  if (!isFiniteNumber(groupChallengeId) || !predicate) return false;

  const feed = await getFeed().getTodayChallengeRecords(groupChallengeId);
  cacheFeedMembers(feed.members, feed.groupId);
  const member = feed.members?.find(predicate);
  if (!member) return false;

  return pushPostDetail(groupChallengeId, member, feed.groupId);
};

const getGroupChallengeId = (
  item: NotificationItem,
  nav?: NotificationNavigationResponse
): number | undefined => {
  if (nav?.targetType === 'FEED' && isFiniteNumber(nav.targetId)) return nav.targetId;
  if (nav?.fallbackTargetType === 'FEED' && isFiniteNumber(nav.fallbackTargetId)) {
    return nav.fallbackTargetId;
  }
  if (item.targetType === 'FEED' && isFiniteNumber(item.targetId)) return item.targetId;
  return undefined;
};

const getGroupId = (
  item: NotificationItem,
  nav?: NotificationNavigationResponse
): number | undefined => {
  if (nav?.targetType === 'GROUP' && isFiniteNumber(nav.targetId)) return nav.targetId;
  if (nav?.fallbackTargetType === 'GROUP' && isFiniteNumber(nav.fallbackTargetId)) {
    return nav.fallbackTargetId;
  }
  if (item.targetType === 'GROUP' && isFiniteNumber(item.targetId)) return item.targetId;
  return undefined;
};

const routeByTarget = (type?: string, id?: number, fallbackType?: string, fallbackId?: number) => {
  switch (type) {
    case 'FEED':
      pushFeed(id);
      return;
    case 'FEED_DETAIL':
      pushFeed(fallbackType === 'FEED' ? fallbackId : undefined, id);
      return;
    case 'GROUP':
      router.push({
        pathname: '/(group)/group-info',
        params: isFiniteNumber(id) ? { groupId: String(id) } : undefined,
      });
      return;
    case 'NONE':
    default:
      // 이동 없음
      return;
  }
};

const routeSenderPost = async (
  item: NotificationItem,
  groupChallengeId?: number
): Promise<boolean> => {
  return routePostDetail(groupChallengeId, (member) => member.userId === item.senderUserId);
};

const routeMyPost = async (groupChallengeId?: number): Promise<boolean> => {
  return routePostDetail(groupChallengeId, (member) => member.isMe === true);
};

const routeSenderProfileFromFeed = async (
  item: NotificationItem,
  groupChallengeId?: number
): Promise<boolean> => {
  if (!isFiniteNumber(item.senderUserId) || !isFiniteNumber(groupChallengeId)) return false;

  const feed = await getFeed().getTodayChallengeRecords(groupChallengeId);
  const sender = feed.members?.find((m) => m.userId === item.senderUserId);
  if (!sender?.groupMemberId || !feed.groupId) return false;

  router.push({
    pathname: '/(group)/mypage',
    params: {
      memberId: String(sender.groupMemberId),
      friendName: sender.displayName ?? '',
      friendUserId: String(item.senderUserId),
      friendGroupId: String(feed.groupId),
      challengeRecordId: sender.challengeRecordId ? String(sender.challengeRecordId) : '',
    },
  });
  return true;
};

const routeSenderProfileFromGroup = async (
  item: NotificationItem,
  groupId?: number
): Promise<boolean> => {
  if (!isFiniteNumber(item.senderUserId) || !isFiniteNumber(groupId)) return false;

  const group = await getGroup().getGroup(groupId);
  const sender = group.members?.find((m) => m.userId === item.senderUserId);
  if (!sender?.id) return false;

  let challengeRecordId = '';
  const groupChallengeId = group.currentChallenge?.id;
  if (isFiniteNumber(groupChallengeId)) {
    const feed = await getFeed().getTodayChallengeRecords(groupChallengeId);
    const senderFeedItem = feed.members?.find((m) => m.userId === item.senderUserId);
    if (senderFeedItem?.challengeRecordId) {
      challengeRecordId = String(senderFeedItem.challengeRecordId);
    }
  }

  router.push({
    pathname: '/(group)/mypage',
    params: {
      memberId: String(sender.id),
      friendName: sender.displayName ?? '',
      friendUserId: String(item.senderUserId),
      friendGroupId: String(groupId),
      challengeRecordId,
    },
  });
  return true;
};

const isMyCurrentFeedVerified = async (groupChallengeId?: number): Promise<boolean> => {
  if (!isFiniteNumber(groupChallengeId)) return false;
  const feed = await getFeed().getTodayChallengeRecords(groupChallengeId);
  return feed.members?.some((m) => m.isMe && m.activityRecord != null) ?? false;
};

export default function NotificationListScreen() {
  const [sections, setSections] = useState<NotificationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    visible: toastVisible,
    message: toastMessage,
    showWithMessage,
  } = useToastVisibility(TOAST_DURATION_MS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response: NotificationHistoryListResponse =
          await getNotificationHistory().getMyNotifications();
        if (cancelled) return;
        const next: NotificationSection[] = (response.groups ?? []).map((g) => ({
          title: g.label ?? '',
          data: g.notifications ?? [],
        }));
        setSections(next);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isEmpty = !isLoading && sections.every((s) => s.data.length === 0);

  const handleBack = () => {
    router.back();
  };

  const handlePressItem = async (item: NotificationHistoryItemResponse) => {
    if (!item.id) return;
    const notification = item as NotificationItem;

    try {
      const nav = await getNotificationHistory().getNotificationHistory(item.id);
      if (!nav.navigable) {
        showWithMessage(nav.reason ?? DEFAULT_NAVIGATION_ERROR_MESSAGE);
        return;
      }

      const kind = getNotificationKind(notification);
      const groupChallengeId = getGroupChallengeId(notification, nav);
      const groupId = getGroupId(notification, nav);

      if (nav.targetType === 'FEED_DETAIL' && isFiniteNumber(nav.targetId)) {
        const routed = await routePostDetail(
          groupChallengeId,
          (member) => member.challengeRecordId === nav.targetId
        );
        if (routed) return;
      }

      if (kind === 'newMember') {
        const routed =
          (await routeSenderProfileFromGroup(notification, groupId)) ||
          (await routeSenderProfileFromFeed(notification, groupChallengeId));
        if (!routed)
          routeByTarget(nav.targetType, nav.targetId, nav.fallbackTargetType, nav.fallbackTargetId);
        return;
      }

      if (kind === 'poke') {
        return;
      }

      if (kind === 'verified' && nav.targetType === 'FEED') {
        const routed = await routeSenderPost(notification, groupChallengeId);
        if (routed) return;
      }

      if (kind === 'comment' && isPreVerificationComment(notification)) {
        const alreadyVerified = await isMyCurrentFeedVerified(groupChallengeId);
        if (alreadyVerified) {
          showWithMessage('이미 인증을 완료했어요');
          return;
        }
      }

      if ((kind === 'comment' || kind === 'reaction') && nav.targetType === 'FEED') {
        const routed = await routeMyPost(groupChallengeId);
        if (routed) return;
      }

      routeByTarget(nav.targetType, nav.targetId, nav.fallbackTargetType, nav.fallbackTargetId);
    } catch {
      showWithMessage(DEFAULT_NAVIGATION_ERROR_MESSAGE);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <HeaderAction label="알림" onPress={handleBack} accessibilityLabel="뒤로가기" />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <Image source={EMPTY_IMAGE} style={styles.emptyImage} resizeMode="contain" />
          <Text style={styles.emptyText}>아직 알림이 없어요</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => String(item.id ?? index)}
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
                source={getSenderAvatarSource(item)}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.rowBody}>
                <Text style={styles.message}>{formatMessage(item)}</Text>
                <Text style={styles.timeLabel}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Toast visible={toastVisible} message={toastMessage} />
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
    justifyContent: 'center',
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
