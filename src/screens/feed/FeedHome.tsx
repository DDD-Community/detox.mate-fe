import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { CurrentUsageGoalTimeResponseUsageGoalType } from '../../api/generated/model';
import { getUserUsageGoalTime } from '../../api/generated/user-usage-goal-time/user-usage-goal-time';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { memberStore } from '../../lib/memberStore';
import { pokeStore } from '../../lib/pokeStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import ActionGuideBanner, {
  type ActionGuideBannerState,
  type GoalState,
} from './ActionGuideBanner';
import FeedCard, { type FeedItem, type PokeEntry, type ReactionEntry } from './FeedCard';
import FeedHeader from './FeedHeader';
import MemberSection, { type MemberItem } from './MemberSection';
import ReactionPicker, {
  isSameReaction,
  normalizeReactionCode,
  type ReactionCode,
} from './ReactionPicker';

const { brown, gray, green } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SRC = require('../../../assets/basic-profile-turtle-hi.png');

type GroupInfo = {
  id: string;
  name: string;
  inviteCode: string;
  members: unknown[];
};

type GroupChallenge = {
  id: string;
};

type ActivityDetail = {
  usageGoalType: string;
  usedMinutes: number;
  goalMinutes: number;
  isAchieved: boolean;
};

type DailyGoal = {
  usageGoalType?: string;
  goalMinutes?: number;
};

type ActivityRecord = {
  submittedAt: string;
  activityImageUrl: string | null;
  reflectionText: string | null;
  allAchieved: boolean;
  details: ActivityDetail[];
};

type TodayChallengeMember = {
  groupMemberId: number;
  groupChallengeParticipantId: number;
  userId: number;
  displayName: string;
  profileImageUrl: string;
  isUserWithdrawn: boolean;
  isMe: boolean;
  memberStatus: string;
  participantStatus: string;
  dailyStatus: string;
  includedInGroupResult: boolean;
  goals: DailyGoal[];
  challengeRecordId: number;
  activityRecord: ActivityRecord | null;
  reactionCount: number;
  commentCount: number;
  pokeCount: number;
  isPoked: boolean;
};

type TodayFeedResponse = {
  groupId: number;
  date: string;
  dailySummary: unknown;
  members: TodayChallengeMember[];
};

type PostReactionResponse = {
  reactionId: number;
  challengeRecordId: number;
  userId: number;
  reactionBody: ReactionCode;
  createdAt: string;
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

const isCreatedToday = (isoDate: string): boolean => {
  const created = new Date(isoDate);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
};

const hasTotalUsageGoal = (member: TodayChallengeMember): boolean =>
  member.goals?.some((goal) => goal.usageGoalType === 'TOTAL_USAGE' && goal.goalMinutes != null) ??
  false;

const getMinutesUntilTomorrow = (now: Date): number => {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(0, Math.ceil((tomorrow.getTime() - now.getTime()) / 60000));
};

const getActionGuideBannerState = ({
  goalState,
  goalSetMemberCount,
  isMyVerified,
  now,
}: {
  goalState: GoalState;
  goalSetMemberCount: number;
  isMyVerified: boolean;
  now: Date;
}): ActionGuideBannerState => {
  if (goalState === 'notSet') return 'notSet';
  if (goalSetMemberCount < 2) return 'waitingForMembers';
  if (goalState === 'setWaiting') return 'setWaiting';
  if (isMyVerified) return 'verified';
  if (getMinutesUntilTomorrow(now) <= 60) return 'deadlineSoon';
  return 'authReady';
};

const formatTimeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

const mapMemberToFeedItem = (m: TodayChallengeMember): FeedItem => {
  const isVerified = m.activityRecord !== null;
  const isGoalAchieved = m.activityRecord?.allAchieved === true;
  const activityImageUrl = m.activityRecord?.activityImageUrl;
  const hasActivityImage = activityImageUrl != null && activityImageUrl.length > 0;
  const totalUsage = m.activityRecord?.details?.find((d) => d.usageGoalType === 'TOTAL_USAGE');
  const totalGoal = m.goals?.find((goal) => goal.usageGoalType === 'TOTAL_USAGE');
  return {
    id: String(m.userId),
    groupChallengeParticipantId: m.groupChallengeParticipantId,
    challengeRecordId: m.challengeRecordId,
    name: m.displayName,
    isMe: m.isMe,
    avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
    commentCount: m.commentCount,
    reactionCount: m.reactionCount,
    pokeCount: m.pokeCount,
    reactions: [],
    pokes: [],
    isVerified,
    isGoalAchieved: isVerified ? isGoalAchieved : undefined,
    photoSource: hasActivityImage && activityImageUrl ? { uri: activityImageUrl } : undefined,
    postText:
      isGoalAchieved || hasActivityImage
        ? (m.activityRecord?.reflectionText ?? undefined)
        : undefined,
    retroText:
      isVerified && !isGoalAchieved ? (m.activityRecord?.reflectionText ?? undefined) : undefined,
    screenTime: formatMinutes(totalUsage?.usedMinutes),
    goal: formatMinutesAsHHMM(totalGoal?.goalMinutes),
    usedMinutes: totalUsage?.usedMinutes,
    goalMinutes: totalGoal?.goalMinutes,
    verifiedTimeAgo:
      isVerified && m.activityRecord?.submittedAt
        ? formatTimeAgo(m.activityRecord.submittedAt)
        : undefined,
  };
};

const compareChallengeMembers = (a: TodayChallengeMember, b: TodayChallengeMember): number => {
  if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;

  const aSubmittedAt = a.activityRecord?.submittedAt;
  const bSubmittedAt = b.activityRecord?.submittedAt;
  const aVerified = aSubmittedAt != null;
  const bVerified = bSubmittedAt != null;

  if (aVerified !== bVerified) return aVerified ? -1 : 1;
  if (aVerified && bVerified) {
    const submittedDiff =
      new Date(bSubmittedAt ?? 0).getTime() - new Date(aSubmittedAt ?? 0).getTime();
    if (submittedDiff !== 0) return submittedDiff;
  }

  const nameDiff = a.displayName.localeCompare(b.displayName, 'ko-KR');
  if (nameDiff !== 0) return nameDiff;

  return a.userId - b.userId;
};

const mapMemberToMemberItem = (m: TodayChallengeMember): MemberItem => ({
  id: String(m.userId),
  name: m.displayName,
  isMe: m.isMe,
  avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
  badgeCount: m.pokeCount > 0 ? m.pokeCount : undefined,
  isVerified: m.activityRecord !== null,
  isGoalAchieved: m.activityRecord?.allAchieved === true,
});

export default function FeedHome() {
  const {
    groupChallengeId: routeGroupChallengeId,
    challengeRecordId,
    scrollChallengeRecordId,
  } = useLocalSearchParams<{
    groupChallengeId?: string;
    challengeRecordId?: string;
    scrollChallengeRecordId?: string;
  }>();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [groupChallengeId, setGroupChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalState, setGoalState] = useState<GoalState>('notSet');
  const [goalSetMemberCount, setGoalSetMemberCount] = useState(0);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [myReactions, setMyReactions] = useState<Record<string, string[]>>({});
  const [pokedMemberIds, setPokedMemberIds] = useState<string[]>([]);
  const [myReactionIds, setMyReactionIds] = useState<Record<string, Record<string, number>>>({});

  const fetchGoalState = useCallback(async () => {
    try {
      const response = await getUserUsageGoalTime().getCurrentGoalTimes();
      const total = response.goals?.find(
        (g) => g.usageGoalType === CurrentUsageGoalTimeResponseUsageGoalType.TOTAL_USAGE
      );
      if (!total) {
        setGoalState('notSet');
        return;
      }
      if (total.createdAt && isCreatedToday(total.createdAt)) {
        setGoalState('setWaiting');
      } else {
        setGoalState('authReady');
      }
    } catch {
      // keep current state on error
    }
  }, []);

  const fetchFeedData = useCallback(async (gcId: string) => {
    try {
      const res = await apiClient.get<TodayFeedResponse>(
        `/group-challenges/${gcId}/challenge-records/today`
      );
      const { members: apiMembers, groupId } = res.data;
      const sortedMembers = [...apiMembers].sort(compareChallengeMembers);
      setFeedItems(sortedMembers.map(mapMemberToFeedItem));
      setMembers(sortedMembers.map(mapMemberToMemberItem));
      setGoalSetMemberCount(apiMembers.filter(hasTotalUsageGoal).length);
      memberStore.setAll(
        sortedMembers.map((m) => ({
          userId: m.userId,
          groupMemberId: m.groupMemberId,
          challengeRecordId: m.challengeRecordId,
          displayName: m.displayName,
          profileImageUrl: m.profileImageUrl,
        })),
        groupId
      );
      const pokedIds = apiMembers.filter((m) => m.isPoked).map((m) => String(m.userId));
      setPokedMemberIds(pokedIds);
      pokedIds.forEach((id) => pokeStore.add(id));
    } catch {
      // keep existing state on error
    }
  }, []);

  const initialLoadDone = useRef(false);

  const fetchGroupAndChallenge = useCallback(async () => {
    try {
      const [groupRes, challengeRes] = await Promise.all([
        apiClient.get<GroupInfo[]>('/me/groups'),
        apiClient.get<GroupChallenge[]>('/me/group-challenges'),
      ]);

      const groups = groupRes.data;
      if (groups.length > 0) {
        const g = groups[0];
        setGroup(g);
      } else {
        setGroup(null);
      }

      const challenges = challengeRes.data;
      const routeGcId =
        routeGroupChallengeId && routeGroupChallengeId.length > 0 ? routeGroupChallengeId : null;
      const gcId = routeGcId ?? (challenges.length > 0 ? challenges[0].id : null);
      setGroupChallengeId(gcId);
      if (gcId) {
        await fetchFeedData(gcId);
      }
    } finally {
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  }, [fetchFeedData, routeGroupChallengeId]);

  useFocusEffect(
    useCallback(() => {
      setPokedMemberIds(pokeStore.getAll());
      fetchGoalState();
      fetchGroupAndChallenge();
    }, [fetchGoalState, fetchGroupAndChallenge])
  );

  const handleInvite = async () => {
    if (!group) return;
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${group.inviteCode}`,
    });
  };

  const handlePoke = async (memberId: string, challengeRecordId?: number) => {
    const alreadyPoked = pokeStore.has(memberId);

    if (!alreadyPoked) {
      pokeStore.add(memberId);
    }
    setPokedMemberIds((prev) => (prev.includes(memberId) ? prev : [...prev, memberId]));

    if (alreadyPoked) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, badgeCount: (m.badgeCount ?? 0) + 1 } : m))
    );
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id !== memberId) return item;
        const myPokeEntry: PokeEntry = { userId: 'me', name: '나', avatarSource: AVATAR_SRC };
        const filteredPokes = item.pokes.filter((p) => p.userId !== 'me');
        return { ...item, pokeCount: item.pokeCount + 1, pokes: [myPokeEntry, ...filteredPokes] };
      })
    );
    if (challengeRecordId == null) return;
    try {
      await apiClient.post(`/challenge-records/${challengeRecordId}/pokes/${memberId}`);
    } catch {
      // 임시 연결 — 에러 무시
    }
  };

  const handleReact = async (itemId: string, reaction: string) => {
    const reactionCode = normalizeReactionCode(reaction);
    if (!reactionCode) return;

    const userEmojis = myReactions[itemId] ?? [];
    const hasThisEmoji = userEmojis.some((current) => isSameReaction(current, reactionCode));

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (hasThisEmoji) {
          return {
            ...item,
            reactionCount: Math.max(0, item.reactionCount - 1),
            reactions: item.reactions.filter(
              (r) => !(r.userId === 'me' && isSameReaction(r.emoji, reactionCode))
            ),
          };
        }
        const myEntry: ReactionEntry = {
          userId: 'me',
          name: '나',
          avatarSource: AVATAR_SRC,
          emoji: reactionCode,
        };
        return {
          ...item,
          reactionCount: item.reactionCount + 1,
          reactions: [myEntry, ...item.reactions],
        };
      })
    );
    setMyReactions((prev) => {
      const current = prev[itemId] ?? [];
      return {
        ...prev,
        [itemId]: hasThisEmoji
          ? current.filter((e) => !isSameReaction(e, reactionCode))
          : [...current, reactionCode],
      };
    });

    const targetItem = feedItems.find((f) => f.id === itemId);
    if (!targetItem?.challengeRecordId) return;

    try {
      if (hasThisEmoji) {
        const reactionId = myReactionIds[itemId]?.[reactionCode];
        if (reactionId) {
          await apiClient.delete(
            `/challenge-records/${targetItem.challengeRecordId}/reactions/${reactionId}`
          );
          setMyReactionIds((prev) => {
            const copy = { ...(prev[itemId] ?? {}) };
            delete copy[reactionCode];
            return { ...prev, [itemId]: copy };
          });
        }
      } else {
        const res = await apiClient.post<PostReactionResponse>(
          `/challenge-records/${targetItem.challengeRecordId}/reactions`,
          { reactionCode }
        );
        setMyReactionIds((prev) => ({
          ...prev,
          [itemId]: { ...(prev[itemId] ?? {}), [reactionCode]: res.data.reactionId },
        }));
      }
    } catch {
      // keep optimistic state on error
    }
  };

  return (
    <View style={styles.root}>
      <FeedHeader groupName={group?.name} groupChallengeId={groupChallengeId} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : group && groupChallengeId ? (
        <ActiveFeed
          onInvite={handleInvite}
          onPoke={handlePoke}
          onReact={handleReact}
          feedItems={feedItems}
          members={members}
          myReactions={myReactions}
          pokedMemberIds={pokedMemberIds}
          goalState={goalState}
          goalSetMemberCount={goalSetMemberCount}
          groupChallengeId={groupChallengeId}
          targetChallengeRecordId={challengeRecordId}
          scrollChallengeRecordId={scrollChallengeRecordId}
        />
      ) : (
        <InactiveFeed onInvite={handleInvite} />
      )}
    </View>
  );
}

// 그룹 또는 챌린지가 없을 때 렌더링
function InactiveFeed({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.container}>
      <EmptyFeedCard onInvite={onInvite} />
    </View>
  );
}

// 오늘 피드가 있는 그룹일 때 렌더링
function ActiveFeed({
  onInvite,
  onPoke,
  onReact,
  feedItems,
  members,
  myReactions,
  pokedMemberIds,
  goalState,
  goalSetMemberCount,
  groupChallengeId,
  targetChallengeRecordId,
  scrollChallengeRecordId,
}: {
  onInvite: () => void;
  onPoke: (memberId: string, challengeRecordId?: number) => void;
  onReact: (itemId: string, emoji: string) => void;
  feedItems: FeedItem[];
  members: MemberItem[];
  myReactions: Record<string, string[]>;
  pokedMemberIds: string[];
  goalState: GoalState;
  goalSetMemberCount: number;
  groupChallengeId: string | null;
  targetChallengeRecordId?: string;
  scrollChallengeRecordId?: string;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const openedTargetRef = useRef<string | null>(null);
  const scrolledTargetRef = useRef<string | null>(null);
  const feedSheetYRef = useRef(0);
  const feedCardListYRef = useRef(0);
  const feedCardYByMemberIdRef = useRef<Record<string, number>>({});
  const [reactionPickerItem, setReactionPickerItem] = useState<FeedItem | null>(null);
  const [isRestoringScroll, setIsRestoringScroll] = useState(() => !!scrollChallengeRecordId);
  const [now, setNow] = useState(() => new Date());

  const enrichedMembers = members.map((m) => ({
    ...m,
    isVerified: feedItems.some((f) => f.id === m.id && f.isVerified),
    isGoalAchieved: feedItems.some((f) => f.id === m.id && f.isVerified && f.isGoalAchieved),
  }));
  const myFeedItem = feedItems.find((item) => item.isMe);
  const bannerState = useMemo(
    () =>
      getActionGuideBannerState({
        goalState,
        goalSetMemberCount,
        isMyVerified: myFeedItem?.isVerified === true,
        now,
      }),
    [goalSetMemberCount, goalState, myFeedItem?.isVerified, now]
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const scrollToFeedItem = useCallback((memberId: string, animated = true) => {
    const cardY = feedCardYByMemberIdRef.current[memberId];
    if (cardY == null) return false;

    const y = Math.max(0, feedSheetYRef.current + feedCardListYRef.current + cardY - spacing[16]);
    scrollRef.current?.scrollTo({ y, animated });
    return true;
  }, []);

  const openPostDetail = useCallback(
    (item: FeedItem) => {
      router.push({
        pathname: '/(feed)/post-detail',
        params: {
          item: JSON.stringify(item),
          goalState,
          isPoked: pokedMemberIds.includes(item.id) ? '1' : '0',
          myReaction: (myReactions[item.id] ?? []).join(','),
          groupChallengeId: groupChallengeId ?? '',
        },
      });
    },
    [goalState, groupChallengeId, myReactions, pokedMemberIds]
  );

  const openMemberProfile = useCallback((item: FeedItem) => {
    if (item.isMe) {
      router.push('/(group)/mypage');
      return;
    }

    const info = memberStore.get(Number(item.id));
    if (!info) return;

    router.push({
      pathname: '/(group)/mypage',
      params: {
        memberId: String(info.groupMemberId),
        friendName: info.displayName,
        friendUserId: item.id,
        friendGroupId: String(info.groupId),
        challengeRecordId: String(info.challengeRecordId),
      },
    });
  }, []);

  const handleMemberPress = useCallback(
    (memberId: string) => {
      const targetItem = feedItems.find((item) => item.id === memberId);
      if (!targetItem) return;

      const canPoke =
        !targetItem.isMe &&
        !targetItem.isVerified &&
        goalState !== 'setWaiting' &&
        !pokedMemberIds.includes(targetItem.id);

      if (canPoke) {
        onPoke(targetItem.id, targetItem.challengeRecordId);
      }
      scrollToFeedItem(targetItem.id);
    },
    [feedItems, goalState, onPoke, pokedMemberIds, scrollToFeedItem]
  );

  const handleReactionPress = useCallback((item: FeedItem) => {
    setReactionPickerItem((current) => (current?.id === item.id ? null : item));
  }, []);

  const handleReactionSelect = useCallback(
    (reactionCode: ReactionCode) => {
      if (!reactionPickerItem) return;

      onReact(reactionPickerItem.id, reactionCode);
      setReactionPickerItem(null);
    },
    [onReact, reactionPickerItem]
  );

  useEffect(() => {
    if (!targetChallengeRecordId || openedTargetRef.current === targetChallengeRecordId) return;

    const targetItem = feedItems.find(
      (item) => String(item.challengeRecordId) === targetChallengeRecordId
    );
    if (!targetItem) return;

    openedTargetRef.current = targetChallengeRecordId;
    openPostDetail(targetItem);
  }, [feedItems, openPostDetail, targetChallengeRecordId]);

  useEffect(() => {
    if (!scrollChallengeRecordId || scrolledTargetRef.current === scrollChallengeRecordId) return;

    const targetItem = feedItems.find(
      (item) => String(item.challengeRecordId) === scrollChallengeRecordId
    );
    if (!targetItem) return;

    let cancelled = false;
    let attempt = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tryScroll = () => {
      if (cancelled) return;
      if (scrollToFeedItem(targetItem.id)) {
        scrolledTargetRef.current = scrollChallengeRecordId;
        return;
      }
      attempt += 1;
      if (attempt < 5) {
        timeout = setTimeout(tryScroll, 80);
      }
    };

    timeout = setTimeout(tryScroll, 80);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [feedItems, scrollChallengeRecordId, scrollToFeedItem]);

  return (
    <View style={styles.feedWrapper}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.activeContainer}
        showsVerticalScrollIndicator={false}
      >
        <ActionGuideBanner
          bannerState={bannerState}
          verifyParams={{
            ...(myFeedItem?.goal ? { goal: myFeedItem.goal } : {}),
            ...(myFeedItem?.groupChallengeParticipantId
              ? {
                  groupChallengeParticipantId: String(myFeedItem.groupChallengeParticipantId),
                }
              : {}),
          }}
          summary={{
            usedMinutes: myFeedItem?.usedMinutes,
            goalMinutes: myFeedItem?.goalMinutes,
          }}
        />
        <View
          style={styles.feedSheet}
          onLayout={(event) => {
            feedSheetYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <MemberSection
            members={enrichedMembers}
            onInvite={onInvite}
            onMemberPress={handleMemberPress}
          />
          <View
            style={styles.feedCardList}
            onLayout={(event) => {
              feedCardListYRef.current = event.nativeEvent.layout.y;
            }}
          >
            {feedItems.map((item) => (
              <View
                key={item.id}
                onLayout={(event) => {
                  feedCardYByMemberIdRef.current[item.id] = event.nativeEvent.layout.y;
                }}
              >
                <FeedCard
                  item={item}
                  goalState={goalState}
                  onPoke={onPoke}
                  isPoked={pokedMemberIds.includes(item.id)}
                  onBodyPress={() => openPostDetail(item)}
                  onProfilePress={() => openMemberProfile(item)}
                  onReactionPress={handleReactionPress}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {reactionPickerItem ? (
        <>
          <Pressable
            style={styles.reactionPickerOverlay}
            onPress={() => setReactionPickerItem(null)}
          />
          <View
            pointerEvents="box-none"
            style={[styles.feedReactionPickerAnchor, { bottom: Math.max(insets.bottom + 12, 20) }]}
          >
            <ReactionPicker
              selectedReactions={myReactions[reactionPickerItem.id]}
              style={styles.feedReactionPicker}
              onSelect={handleReactionSelect}
            />
          </View>
        </>
      ) : (
        <Pressable
          style={styles.fab}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Icon name="arrowUp" size={20} color={WHITE} />
        </Pressable>
      )}
    </View>
  );
}

function EmptyFeedCard({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyContent}>
        <Image
          source={require('../../../assets/onboarding-none-feed.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <Text style={styles.emptySubtitle}>
          피드가 없어요{'\n'} 친구를 초대하여 함께 디톡스를 시작해보세요
        </Text>
      </View>
      <Button
        label="친구 초대하기"
        color="primary"
        size="sm"
        leadingIcon={<Icon name="shareFat" size={16} color={WHITE} />}
        onPress={onInvite}
        style={styles.emptyInviteButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  feedWrapper: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: spacing[96],
    gap: spacing[12],
  },
  activeContainer: {
    paddingBottom: spacing[96],
  },
  feedSheet: {
    marginTop: -62,
    backgroundColor: brown[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  feedCardList: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[28],
    gap: spacing[20],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  fab: {
    position: 'absolute',
    bottom: spacing[32],
    right: spacing[24],
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  reactionPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  feedReactionPickerAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  feedReactionPicker: {
    width: 311,
  },
  emptyCard: {
    borderRadius: radius[16],
    padding: spacing[24],
    paddingTop: 150,
    alignItems: 'center',
    gap: spacing[20],
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing[12],
  },
  emptyImage: {
    width: 87,
    height: 88,
  },
  emptySubtitle: {
    ...typography.accent.body2,
    color: gray[400],
    textAlign: 'center',
  },
  emptyInviteButton: {
    alignSelf: 'center',
    width: 140,
  },
});
