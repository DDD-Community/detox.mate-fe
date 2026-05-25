import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
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
import apiClient from '../../api/client';
import { CurrentUsageGoalTimeResponseUsageGoalType } from '../../api/generated/model';
import { getUserUsageGoalTime } from '../../api/generated/user-usage-goal-time/user-usage-goal-time';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { memberStore } from '../../lib/memberStore';
import { pokeStore } from '../../lib/pokeStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import ActionGuideBanner, { type GoalState } from './ActionGuideBanner';
import FeedCard, { type FeedItem, type PokeEntry, type ReactionEntry } from './FeedCard';
import FeedHeader from './FeedHeader';
import MemberSection, { type MemberItem } from './MemberSection';

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

type ReactionCode = 'THUMBSUP' | 'FIGHTING' | 'MUSCLE' | 'TURTLE' | 'GLOOMY';

const EMOJI_TO_CODE: Record<string, ReactionCode> = {
  '👍': 'THUMBSUP',
  '🔥': 'FIGHTING',
  '💪': 'MUSCLE',
  '🐢': 'TURTLE',
  '🥹': 'GLOOMY',
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
    photoSource:
      isGoalAchieved && m.activityRecord?.activityImageUrl
        ? { uri: m.activityRecord.activityImageUrl }
        : undefined,
    postText: isGoalAchieved ? (m.activityRecord?.reflectionText ?? undefined) : undefined,
    retroText:
      isVerified && !isGoalAchieved ? (m.activityRecord?.reflectionText ?? undefined) : undefined,
    screenTime: formatMinutes(totalUsage?.usedMinutes),
    goal: formatMinutesAsHHMM(totalGoal?.goalMinutes),
    verifiedTimeAgo:
      isVerified && m.activityRecord?.submittedAt
        ? formatTimeAgo(m.activityRecord.submittedAt)
        : undefined,
  };
};

const mapMemberToMemberItem = (m: TodayChallengeMember): MemberItem => ({
  id: String(m.userId),
  name: m.displayName,
  avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
  badgeCount: m.pokeCount > 0 ? m.pokeCount : undefined,
  isGoalAchieved: m.activityRecord?.allAchieved === true,
});

export default function FeedHome() {
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [groupChallengeId, setGroupChallengeId] = useState<string | null>(null);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalState, setGoalState] = useState<GoalState>('notSet');
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
      setFeedItems(apiMembers.map(mapMemberToFeedItem));
      setMembers(apiMembers.map(mapMemberToMemberItem));
      memberStore.setAll(
        apiMembers.map((m) => ({
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
        setIsGroupActive(g.members.length >= 2);
      } else {
        setGroup(null);
        setIsGroupActive(false);
      }

      const challenges = challengeRes.data;
      const gcId = challenges.length > 0 ? challenges[0].id : null;
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
  }, [fetchFeedData]);

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
    pokeStore.add(memberId);
    setPokedMemberIds((prev) => [...prev, memberId]);
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
    if (!challengeRecordId) return;
    try {
      await apiClient.post(`/challenge-records/${challengeRecordId}/pokes/${memberId}`);
    } catch {
      // 임시 연결 — 에러 무시
    }
  };

  const handleReact = async (itemId: string, emoji: string) => {
    const userEmojis = myReactions[itemId] ?? [];
    const hasThisEmoji = userEmojis.includes(emoji);

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (hasThisEmoji) {
          return {
            ...item,
            reactionCount: Math.max(0, item.reactionCount - 1),
            reactions: item.reactions.filter((r) => !(r.userId === 'me' && r.emoji === emoji)),
          };
        }
        const myEntry: ReactionEntry = {
          userId: 'me',
          name: '나',
          avatarSource: AVATAR_SRC,
          emoji,
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
        [itemId]: hasThisEmoji ? current.filter((e) => e !== emoji) : [...current, emoji],
      };
    });

    const targetItem = feedItems.find((f) => f.id === itemId);
    if (!targetItem?.challengeRecordId) return;
    const reactionCode = EMOJI_TO_CODE[emoji];
    if (!reactionCode) return;

    try {
      if (hasThisEmoji) {
        const reactionId = myReactionIds[itemId]?.[emoji];
        if (reactionId) {
          await apiClient.delete(
            `/challenge-records/${targetItem.challengeRecordId}/reactions/${reactionId}`
          );
          setMyReactionIds((prev) => {
            const copy = { ...(prev[itemId] ?? {}) };
            delete copy[emoji];
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
          [itemId]: { ...(prev[itemId] ?? {}), [emoji]: res.data.reactionId },
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
      ) : isGroupActive ? (
        <ActiveFeed
          onInvite={handleInvite}
          onPoke={handlePoke}
          onReact={handleReact}
          feedItems={feedItems}
          members={members}
          myReactions={myReactions}
          pokedMemberIds={pokedMemberIds}
          goalState={goalState}
          groupChallengeId={groupChallengeId}
        />
      ) : (
        <InactiveFeed onInvite={handleInvite} />
      )}
    </View>
  );
}

// isGroupActive = false 일 때 렌더링
function InactiveFeed({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.container}>
      <EmptyFeedCard onInvite={onInvite} />
    </View>
  );
}

// isGroupActive = true 일 때 렌더링
function ActiveFeed({
  onInvite,
  onPoke,
  onReact,
  feedItems,
  members,
  myReactions,
  pokedMemberIds,
  goalState,
  groupChallengeId,
}: {
  onInvite: () => void;
  onPoke: (memberId: string, challengeRecordId?: number) => void;
  onReact: (itemId: string, emoji: string) => void;
  feedItems: FeedItem[];
  members: MemberItem[];
  myReactions: Record<string, string[]>;
  pokedMemberIds: string[];
  goalState: GoalState;
  groupChallengeId: string | null;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const enrichedMembers = members.map((m) => ({
    ...m,
    isGoalAchieved: feedItems.some((f) => f.id === m.id && f.isVerified && f.isGoalAchieved),
  }));
  const myFeedItem = feedItems.find((item) => item.isMe);

  return (
    <View style={styles.feedWrapper}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ActionGuideBanner
          goalState={goalState}
          verifyParams={{
            ...(myFeedItem?.goal ? { goal: myFeedItem.goal } : {}),
            ...(myFeedItem?.groupChallengeParticipantId
              ? {
                  groupChallengeParticipantId: String(myFeedItem.groupChallengeParticipantId),
                }
              : {}),
          }}
        />
        <MemberSection members={enrichedMembers} onInvite={onInvite} />
        {feedItems.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            goalState={goalState}
            onPoke={onPoke}
            onReact={onReact}
            isPoked={pokedMemberIds.includes(item.id)}
            myReactions={myReactions[item.id]}
            onBodyPress={() =>
              router.push({
                pathname: '/(feed)/post-detail',
                params: {
                  item: JSON.stringify(item),
                  goalState,
                  isPoked: pokedMemberIds.includes(item.id) ? '1' : '0',
                  myReaction: (myReactions[item.id] ?? []).join(','),
                  groupChallengeId: groupChallengeId ?? '',
                },
              })
            }
          />
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      >
        <Icon name="arrowUp" size={20} color={WHITE} />
      </Pressable>
    </View>
  );
}

function EmptyFeedCard({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Image
        source={require('../../../assets/onboarding-none-feed.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptySubtitle}>
        피드가 없어요{'\n'} 친구를 초대하여 함께 디톡스를 시작해 보세요
      </Text>
      <Button
        label="친구 초대하기"
        color="primary"
        size="lg"
        leadingIcon={<Icon name="shareFat" size={20} color={WHITE} />}
        onPress={onInvite}
        style={{ alignSelf: 'stretch' }}
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
  emptyCard: {
    borderRadius: radius[16],
    padding: spacing[24],
    paddingTop: 150,
    alignItems: 'center',
    gap: spacing[12],
  },
  emptyImage: {
    width: 120,
    height: 120,
  },
  emptySubtitle: {
    ...typography.primary.body2R,
    color: gray[500],
    textAlign: 'center',
  },
});
