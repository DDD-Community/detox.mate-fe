import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  isUsableId(member.userId) && isUsableId(member.groupMemberId);

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

// 피드 카드 정렬: 인증 완료 → 미인증 가나다순 → userId (나 고정 없음)
const compareFeedCards = (a: MemberResponse, b: MemberResponse): number => {
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
      const sortedFeedItems = [...apiMembers].sort(compareFeedCards);
      const groupId = overview.groupId ?? today.groupId;
      const groupName = overview.groupName ?? fallbackGroup?.name;
      const inviteCode = overview.inviteCode ?? fallbackGroup?.inviteCode;
      setGroup({
        ...(isUsableId(groupId) ? { id: String(groupId) } : {}),
        ...(groupName ? { name: groupName } : {}),
        ...(inviteCode ? { inviteCode } : {}),
      });
      setFeedItems(sortedFeedItems.map(mapMemberToFeedItem));
      setMembers(sortedMembers.map(mapMemberToMemberItem));
      const goalSetCount = apiMembers.filter(hasTotalUsageGoal).length;
      // [임시 디버그] 목표 설정 인원 확인
      console.log('[DEBUG] goalSetMemberCount:', goalSetCount);
      console.log(
        '[DEBUG] members goals:',
        JSON.stringify(
          apiMembers.map((m) => ({ name: m.displayName, goals: m.goals })),
          null,
          2
        )
      );
      const myMember = apiMembers.find((m) => m.isMe === true);
      const myGoal = myMember?.goals?.find((g) => g.usageGoalType === 'TOTAL_USAGE');
      console.log('[DEBUG] 내 목표 시간:', myGoal ? `${myGoal.goalMinutes}분` : '미설정');
      setGoalSetMemberCount(goalSetCount);
      if (isUsableId(groupId)) {
        memberStore.setAll(
          sortedMembers.filter(isStoreableMember).map((m) => ({
            userId: m.userId,
            groupMemberId: m.groupMemberId,
            ...(isUsableId(m.challengeRecordId) ? { challengeRecordId: m.challengeRecordId } : {}),
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
    if (hasThisEmoji) return;

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
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
      return { ...prev, [itemId]: [...current, reactionCode] };
    });

    const targetItem = feedItems.find((f) => f.id === itemId);
    if (!targetItem?.challengeRecordId) return;

    try {
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
  const feedWrapperRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const openedTargetRef = useRef<string | null>(null);
  const scrolledTargetRef = useRef<string | null>(null);
  const feedSheetYRef = useRef(0);
  const feedCardListYRef = useRef(0);
  const feedCardYByMemberIdRef = useRef<Record<string, number>>({});
  const [reactionPickerItem, setReactionPickerItem] = useState<FeedItem | null>(null);
  const reactionPickerItemRef = useRef<FeedItem | null>(null);
  reactionPickerItemRef.current = reactionPickerItem;
  const [pickerLayout, setPickerLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
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

  const openMemberProfile = useCallback(
    (item: FeedItem) => {
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
          groupChallengeId: groupChallengeId ?? '',
          challengeRecordId: info.challengeRecordId != null ? String(info.challengeRecordId) : '',
          isPoked: pokedMemberIds.includes(item.id) ? '1' : '0',
        },
      });
    },
    [groupChallengeId, pokedMemberIds]
  );

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
        Alert.alert(`${targetItem.name}님을 콕 찔렀어요!`);
        onPoke(targetItem.id, targetItem.challengeRecordId);
      }
      scrollToFeedItem(targetItem.id);
    },
    [feedItems, goalState, onPoke, pokedMemberIds, scrollToFeedItem]
  );

  const handleReactionPress = useCallback(
    (item: FeedItem, footerLayout: { x: number; y: number; width: number; height: number }) => {
      if (reactionPickerItemRef.current?.id === item.id) {
        setReactionPickerItem(null);
        setPickerLayout(null);
        return;
      }
      feedWrapperRef.current?.measureInWindow((wrapperX, wrapperY) => {
        setPickerLayout({
          top: footerLayout.y - wrapperY,
          left: footerLayout.x - wrapperX,
          width: footerLayout.width,
        });
      });
      setReactionPickerItem(item);
    },
    []
  );

  const handleReactionSelect = useCallback(
    (reactionCode: ReactionCode) => {
      const item = reactionPickerItemRef.current;
      if (!item) return;
      onReact(item.id, reactionCode);
      setReactionPickerItem(null);
      setPickerLayout(null);
    },
    [onReact]
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
    <View ref={feedWrapperRef} style={styles.feedWrapper}>
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

      {reactionPickerItem && pickerLayout ? (
        <>
          <Pressable
            style={styles.reactionPickerOverlay}
            onPress={() => {
              setReactionPickerItem(null);
              setPickerLayout(null);
            }}
          />
          <ReactionPicker
            selectedReactions={myReactions[reactionPickerItem.id]}
            style={{
              position: 'absolute',
              top: pickerLayout.top,
              left: pickerLayout.left,
              width: pickerLayout.width,
            }}
            onSelect={handleReactionSelect}
          />
        </>
      ) : null}
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
  reactionPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
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
