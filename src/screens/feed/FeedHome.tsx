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
import Svg, { Path } from 'react-native-svg';
import apiClient from '../../api/client';
import { getFeed } from '../../api/generated/feed/feed';
import { getGroupChallenge } from '../../api/generated/group-challenge/group-challenge';
import {
  CurrentUsageGoalTimeResponseUsageGoalType,
  type MemberResponse,
  type ReactionResponse,
} from '../../api/generated/model';
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
const SCROLL_TOP_BUTTON_SIZE = 44;
const SCROLL_TOP_ICON_SIZE = 16;
const feedApi = getFeed();
const groupChallengeApi = getGroupChallenge();

type FeedGroup = {
  id?: string;
  name?: string;
  inviteCode?: string;
};

type StoreableMember = MemberResponse & {
  userId: number;
  groupMemberId: number;
  challengeRecordId: number;
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

const hasTotalUsageGoal = (member: MemberResponse): boolean =>
  member.goals?.some((goal) => goal.usageGoalType === 'TOTAL_USAGE' && goal.goalMinutes != null) ??
  false;

const isUsableId = (id: number | undefined): id is number => id != null && Number.isFinite(id);

const isStoreableMember = (member: MemberResponse): member is StoreableMember =>
  isUsableId(member.userId) &&
  isUsableId(member.groupMemberId) &&
  isUsableId(member.challengeRecordId);

const getRouteGroupChallengeId = (value: string | undefined): string | null => {
  if (!value) return null;
  const numericId = Number(value);
  return Number.isFinite(numericId) && numericId > 0 ? String(numericId) : null;
};

const getRouteGroup = (groupName?: string, inviteCode?: string): FeedGroup | null => {
  if (!groupName && !inviteCode) return null;
  return {
    ...(groupName ? { name: groupName } : {}),
    ...(inviteCode ? { inviteCode } : {}),
  };
};

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

const mapMemberToFeedItem = (m: MemberResponse): FeedItem => {
  const isVerified = m.activityRecord != null;
  const isGoalAchieved = m.activityRecord?.allAchieved === true;
  const activityImageUrl = m.activityRecord?.activityImageUrl;
  const hasActivityImage = activityImageUrl != null && activityImageUrl.length > 0;
  const totalUsage = m.activityRecord?.details?.find((d) => d.usageGoalType === 'TOTAL_USAGE');
  const totalGoal = m.goals?.find((goal) => goal.usageGoalType === 'TOTAL_USAGE');
  return {
    id: String(m.userId ?? ''),
    groupChallengeParticipantId: m.groupChallengeParticipantId,
    challengeRecordId: m.challengeRecordId,
    name: m.displayName ?? '',
    isMe: m.isMe === true,
    avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
    commentCount: m.commentCount ?? 0,
    reactionCount: m.reactionCount ?? 0,
    pokeCount: m.pokeCount ?? 0,
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

const compareChallengeMembers = (a: MemberResponse, b: MemberResponse): number => {
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

  const nameDiff = (a.displayName ?? '').localeCompare(b.displayName ?? '', 'ko-KR');
  if (nameDiff !== 0) return nameDiff;

  return (a.userId ?? 0) - (b.userId ?? 0);
};

const mapMemberToMemberItem = (m: MemberResponse): MemberItem => ({
  id: String(m.userId ?? ''),
  name: m.displayName ?? '',
  isMe: m.isMe === true,
  avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
  badgeCount: (m.pokeCount ?? 0) > 0 ? m.pokeCount : undefined,
  isVerified: m.activityRecord != null,
  isGoalAchieved: m.activityRecord?.allAchieved === true,
});

export default function FeedHome() {
  const {
    groupChallengeId: routeGroupChallengeId,
    groupName: routeGroupName,
    inviteCode: routeInviteCode,
    challengeRecordId,
    scrollChallengeRecordId,
  } = useLocalSearchParams<{
    groupChallengeId?: string;
    groupName?: string;
    inviteCode?: string;
    challengeRecordId?: string;
    scrollChallengeRecordId?: string;
  }>();
  const [group, setGroup] = useState<FeedGroup | null>(null);
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

  const fetchFeedData = useCallback(async (gcId: string, fallbackGroup?: FeedGroup | null) => {
    try {
      const numericGroupChallengeId = Number(gcId);
      if (!Number.isFinite(numericGroupChallengeId)) return;

      const [overview, today] = await Promise.all([
        feedApi.getGroupChallengeOverview(numericGroupChallengeId),
        feedApi.getTodayChallengeRecords(numericGroupChallengeId),
      ]);
      const apiMembers = today.members ?? [];
      const sortedMembers = [...apiMembers].sort(compareChallengeMembers);
      const groupId = overview.groupId ?? today.groupId;
      const groupName = overview.groupName ?? fallbackGroup?.name;
      const inviteCode = overview.inviteCode ?? fallbackGroup?.inviteCode;
      setGroup({
        ...(isUsableId(groupId) ? { id: String(groupId) } : {}),
        ...(groupName ? { name: groupName } : {}),
        ...(inviteCode ? { inviteCode } : {}),
      });
      setFeedItems(sortedMembers.map(mapMemberToFeedItem));
      setMembers(sortedMembers.map(mapMemberToMemberItem));
      setGoalSetMemberCount(apiMembers.filter(hasTotalUsageGoal).length);
      if (isUsableId(groupId)) {
        memberStore.setAll(
          sortedMembers.filter(isStoreableMember).map((m) => ({
            userId: m.userId,
            groupMemberId: m.groupMemberId,
            challengeRecordId: m.challengeRecordId,
            displayName: m.displayName ?? '',
            profileImageUrl: m.profileImageUrl,
          })),
          groupId
        );
      }
      const pokedIds = apiMembers
        .filter((m) => m.isPoked === true && isUsableId(m.userId))
        .map((m) => String(m.userId));
      setPokedMemberIds(pokedIds);
      pokedIds.forEach((id) => pokeStore.add(id));
    } catch {
      // keep existing state on error
    }
  }, []);

  const initialLoadDone = useRef(false);

  const fetchGroupAndChallenge = useCallback(async () => {
    try {
      const routeGcId = getRouteGroupChallengeId(routeGroupChallengeId);
      const routeGroup = getRouteGroup(routeGroupName, routeInviteCode);
      const challenges = routeGcId ? [] : await groupChallengeApi.getMyGroupChallenges();
      const firstChallengeId = challenges[0]?.id;
      const gcId = routeGcId ?? (firstChallengeId != null ? String(firstChallengeId) : null);
      setGroupChallengeId(gcId);
      if (gcId) {
        await fetchFeedData(gcId, routeGroup);
      } else {
        setGroup(routeGroup);
        setFeedItems([]);
        setMembers([]);
        setGoalSetMemberCount(0);
      }
    } finally {
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  }, [fetchFeedData, routeGroupChallengeId, routeGroupName, routeInviteCode]);

  useFocusEffect(
    useCallback(() => {
      setPokedMemberIds(pokeStore.getAll());
      fetchGoalState();
      fetchGroupAndChallenge();
    }, [fetchGoalState, fetchGroupAndChallenge])
  );

  const handleInvite = async () => {
    if (!group?.inviteCode) return;
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
        const res = await apiClient.post<ReactionResponse>(
          `/challenge-records/${targetItem.challengeRecordId}/reactions`,
          { reactionCode }
        );
        if (res.data.reactionId != null) {
          setMyReactionIds((prev) => ({
            ...prev,
            [itemId]: { ...(prev[itemId] ?? {}), [reactionCode]: res.data.reactionId! },
          }));
        }
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
          fromFeedHome: '1',
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
    if (!scrollChallengeRecordId) {
      setIsRestoringScroll(false);
      return;
    }

    if (scrolledTargetRef.current === scrollChallengeRecordId) {
      setIsRestoringScroll(false);
      return;
    }

    const targetItem = feedItems.find(
      (item) => String(item.challengeRecordId) === scrollChallengeRecordId
    );
    if (!targetItem) {
      if (feedItems.length > 0) {
        setIsRestoringScroll(false);
      }
      return;
    }

    let cancelled = false;
    let attempt = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let revealFrame: number | null = null;

    setIsRestoringScroll(true);

    const tryScroll = () => {
      if (cancelled) return;
      if (scrollToFeedItem(targetItem.id, false)) {
        scrolledTargetRef.current = scrollChallengeRecordId;
        revealFrame = requestAnimationFrame(() => {
          if (!cancelled) {
            setIsRestoringScroll(false);
          }
        });
        return;
      }
      attempt += 1;
      if (attempt < 5) {
        timeout = setTimeout(tryScroll, 80);
      } else {
        setIsRestoringScroll(false);
      }
    };

    timeout = setTimeout(tryScroll, 80);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (revealFrame != null) {
        cancelAnimationFrame(revealFrame);
      }
    };
  }, [feedItems, scrollChallengeRecordId, scrollToFeedItem]);

  return (
    <View style={styles.feedWrapper}>
      <ScrollView
        ref={scrollRef}
        style={isRestoringScroll ? styles.restoringScroll : undefined}
        contentContainerStyle={styles.activeContainer}
        pointerEvents={isRestoringScroll ? 'none' : 'auto'}
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

      {isRestoringScroll ? null : reactionPickerItem ? (
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
          accessibilityRole="button"
          accessibilityLabel="맨 위로 이동"
        >
          <ScrollTopIcon />
        </Pressable>
      )}
    </View>
  );
}

function ScrollTopIcon() {
  return (
    <Svg
      width={SCROLL_TOP_ICON_SIZE}
      height={SCROLL_TOP_ICON_SIZE}
      viewBox={`0 0 ${SCROLL_TOP_ICON_SIZE} ${SCROLL_TOP_ICON_SIZE}`}
    >
      <Path
        d="M9.85403 5.35414C9.80759 5.40063 9.75245 5.43751 9.69175 5.46267C9.63105 5.48784 9.56599 5.50079 9.50028 5.50079C9.43457 5.50079 9.36951 5.48784 9.30881 5.46267C9.24811 5.43751 9.19296 5.40063 9.14653 5.35414L5.50028 1.70727V11.5004C5.50028 11.633 5.4476 11.7602 5.35383 11.8539C5.26006 11.9477 5.13289 12.0004 5.00028 12.0004C4.86767 12.0004 4.74049 11.9477 4.64672 11.8539C4.55296 11.7602 4.50028 11.633 4.50028 11.5004V1.70727L0.854028 5.35414C0.760208 5.44796 0.63296 5.50067 0.500278 5.50067C0.367596 5.50067 0.240348 5.44796 0.146528 5.35414C0.0527077 5.26032 9.88558e-10 5.13308 0 5.00039C-9.88558e-10 4.86771 0.0527077 4.74046 0.146528 4.64664L4.64653 0.146643C4.69296 0.100155 4.74811 0.0632756 4.80881 0.0381135C4.86951 0.0129513 4.93457 0 5.00028 0C5.06599 0 5.13105 0.0129513 5.19175 0.0381135C5.25245 0.0632756 5.30759 0.100155 5.35403 0.146643L9.85403 4.64664C9.90052 4.69308 9.9374 4.74822 9.96256 4.80892C9.98772 4.86962 10.0007 4.93469 10.0007 5.00039C10.0007 5.0661 9.98772 5.13116 9.96256 5.19186C9.9374 5.25256 9.90052 5.30771 9.85403 5.35414Z"
        fill={gray[700]}
        transform="translate(3 2)"
      />
    </Svg>
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
          피드가 없어요{'\n'}친구를 초대하여 함께 디톡스를 시작해보세요
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
  restoringScroll: {
    opacity: 0,
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
    right: spacing[16],
    width: SCROLL_TOP_BUTTON_SIZE,
    height: SCROLL_TOP_BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: gray[900],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    letterSpacing: -0.32,
  },
  emptyInviteButton: {
    alignSelf: 'center',
    width: 140,
  },
});
