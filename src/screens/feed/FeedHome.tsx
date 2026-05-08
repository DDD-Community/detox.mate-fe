import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Button } from '../../components/Button';
import { pokeStore } from '../../lib/pokeStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import ActionGuideBanner, { type GoalState } from './ActionGuideBanner';
import FeedCard, { type FeedItem, type PokeEntry, type ReactionEntry } from './FeedCard';
import FeedHeader from './FeedHeader';
import { MOCK_COMMENTS } from './FeedPostDetail';
import MemberSection, { type MemberItem } from './MemberSection';

const { brown, gray, green } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SRC = require('../../../assets/basic-profile-turtle-hi.png');
const VERIFIED_ME_PHOTO = require('../../../assets/turtle-hi.png');

const INITIAL_MEMBERS: MemberItem[] = [
  { id: '1', name: '나', avatarSource: AVATAR_SRC },
  { id: '2', name: '지수', avatarSource: AVATAR_SRC },
  { id: '3', name: '민준', avatarSource: AVATAR_SRC },
  { id: '4', name: '서연', avatarSource: AVATAR_SRC },
  { id: '5', name: '승호', avatarSource: AVATAR_SRC },
  { id: '6', name: '현우', avatarSource: AVATAR_SRC },
];

const EMPTY_ITEM_BASE = { reactions: [] as ReactionEntry[], pokes: [] as PokeEntry[] };

const FEED_UNVERIFIED: FeedItem[] = [
  { id: '1', name: '나', isMe: true, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '2', name: '지수', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '3', name: '민준', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '4', name: '서연', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '5', name: '승호', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '6', name: '현우', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
];

const FEED_AUTH_READY: FeedItem[] = [
  {
    id: '2',
    name: '지수',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: 2,
    reactionCount: 2,
    pokeCount: 0,
    reactions: [
      { userId: '3', name: '민준', avatarSource: AVATAR_SRC, emoji: '💪' },
      { userId: '4', name: '서연', avatarSource: AVATAR_SRC, emoji: '👍' },
    ],
    pokes: [],
    isVerified: true,
    verifiedTimeAgo: '2시간 전',
    isGoalAchieved: true,
    photoSource: VERIFIED_ME_PHOTO,
    postText: '2시간동안 런닝 뛰고 온 날!',
    screenTime: '1h 10m',
  },
  {
    id: '3',
    name: '민준',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: 1,
    reactionCount: 1,
    pokeCount: 0,
    reactions: [
      { userId: '2', name: '지수', avatarSource: AVATAR_SRC, emoji: '🥹' },
    ],
    pokes: [],
    isVerified: true,
    verifiedTimeAgo: '5시간 전',
    isGoalAchieved: false,
    retroText: '릴스 무한루프에 빠졌어요... 내일은 폰 도서관 사물함에 넣어둘게요 ㅠㅠ',
    screenTime: '6h 5m',
  },
  { id: '1', name: '나', isMe: true, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '4', name: '서연', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '5', name: '승호', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
  { id: '6', name: '현우', isMe: false, avatarSource: AVATAR_SRC, commentCount: 0, reactionCount: 0, pokeCount: 0, isVerified: false, ...EMPTY_ITEM_BASE },
];

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

type ChallengeMember = {
  userId: number;
  groupMemberId: number;
  displayName: string;
  profileImageUrl: string;
  challengeStatus: 'VERIFIED' | 'NOT_YET';
  activityImageUrl: string | null;
  oneLineReview: string | null;
  totalUsedMinutes: number | null;
  goalMinutes: string;
  stampId: number | null;
  reactionCount: number;
  commentCount: number;
  pokeCount: number;
  isPoked: boolean;
};

type ChallengeHomeResponse = {
  challenge: {
    groupChallengeId: number;
    groupChallengeName: string;
    startAt: string;
    streakCount: number;
  };
  members: ChallengeMember[];
};

type PostReactionResponse = {
  reactionId: number;
  groupChallengeId: number;
  stampId: number;
  userId: number;
  reactionBody: ReactionCode;
  createdAt: string;
};

const formatMinutes = (minutes: number | null): string | undefined => {
  if (minutes == null) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const mapMemberToFeedItem = (m: ChallengeMember, myUserId: number | null): FeedItem => {
  const isVerified = m.challengeStatus === 'VERIFIED';
  const isGoalAchieved = isVerified && m.activityImageUrl != null;
  return {
    id: String(m.userId),
    stampId: m.stampId ?? undefined,
    name: m.displayName,
    isMe: m.userId === myUserId,
    avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
    commentCount: m.commentCount,
    reactionCount: m.reactionCount,
    pokeCount: m.pokeCount,
    reactions: [],
    pokes: [],
    isVerified,
    isGoalAchieved: isVerified ? isGoalAchieved : undefined,
    photoSource: isGoalAchieved ? { uri: m.activityImageUrl! } : undefined,
    postText: isGoalAchieved ? (m.oneLineReview ?? undefined) : undefined,
    retroText: isVerified && !isGoalAchieved ? (m.oneLineReview ?? undefined) : undefined,
    screenTime: formatMinutes(m.totalUsedMinutes),
  };
};

const mapMemberToMemberItem = (m: ChallengeMember): MemberItem => ({
  id: String(m.userId),
  name: m.displayName,
  avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
  badgeCount: m.pokeCount > 0 ? m.pokeCount : undefined,
  isGoalAchieved: m.challengeStatus === 'VERIFIED' && m.activityImageUrl != null,
});

export default function FeedHome() {
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [groupChallengeId, setGroupChallengeId] = useState<string | null>(null);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalState, setGoalState] = useState<GoalState>('notSet');
  const [devGroupActive, setDevGroupActive] = useState(false);
  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(FEED_UNVERIFIED);
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [pokedMemberIds, setPokedMemberIds] = useState<string[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myReactionIds, setMyReactionIds] = useState<Record<string, number>>({});

  const effectiveGroupActive = isGroupActive || devGroupActive;

  useFocusEffect(
    useCallback(() => {
      setPokedMemberIds(pokeStore.getAll());
    }, [])
  );

  useEffect(() => {
    if (groupChallengeId) return;
    setFeedItems(goalState === 'authReady' ? [...FEED_AUTH_READY] : [...FEED_UNVERIFIED]);
    setMyReactions({});
  }, [goalState, groupChallengeId]);

  useEffect(() => {
    const fetchData = async () => {
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
        }

        const challenges = challengeRes.data;
        if (challenges.length > 0) {
          setGroupChallengeId(challenges[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!groupChallengeId) return;
    const fetchHomeData = async () => {
      try {
        const myIdStr = await SecureStore.getItemAsync('currentUserId');
        const myUserIdNum = myIdStr ? Number(myIdStr) : null;
        setMyUserId(myUserIdNum);
        const res = await apiClient.get<ChallengeHomeResponse>(
          `/group-challenges/${groupChallengeId}/home`
        );
        const { members: apiMembers } = res.data;
        setFeedItems(apiMembers.map((m) => mapMemberToFeedItem(m, myUserIdNum)));
        setMembers(apiMembers.map(mapMemberToMemberItem));
        const pokedIds = apiMembers.filter((m) => m.isPoked).map((m) => String(m.userId));
        setPokedMemberIds(pokedIds);
        pokedIds.forEach((id) => pokeStore.add(id));
      } catch {
        // keep existing state on error
      }
    };
    fetchHomeData();
  }, [groupChallengeId]);

  const handleInvite = async () => {
    if (!group) return;
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${group.inviteCode}`,
    });
  };

  const handlePoke = async (memberId: string) => {
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
    if (!group) return;
    try {
      await apiClient.post(`/me/groups/${group.id}/members/${memberId}/poke`);
    } catch {
      // 임시 연결 — 에러 무시
    }
  };

  const handleReact = async (itemId: string, emoji: string) => {
    const alreadyReacted = !!myReactions[itemId];
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const myEntry: ReactionEntry = { userId: 'me', name: '나', avatarSource: AVATAR_SRC, emoji };
        const filtered = item.reactions.filter((r) => r.userId !== 'me');
        return {
          ...item,
          reactionCount: alreadyReacted ? item.reactionCount : item.reactionCount + 1,
          reactions: [myEntry, ...filtered],
        };
      })
    );
    setMyReactions((prev) => ({ ...prev, [itemId]: emoji }));

    if (!groupChallengeId) return;
    const targetItem = feedItems.find((f) => f.id === itemId);
    if (!targetItem?.stampId) return;
    const reactionCode = EMOJI_TO_CODE[emoji];
    if (!reactionCode) return;

    try {
      const oldReactionId = myReactionIds[itemId];
      if (oldReactionId) {
        await apiClient.delete(`/group-challenges/${groupChallengeId}/reactions/${oldReactionId}`);
      }
      const res = await apiClient.post<PostReactionResponse>(
        `/group-challenges/${groupChallengeId}/stamps/${targetItem.stampId}/reactions`,
        { reactionCode }
      );
      setMyReactionIds((prev) => ({ ...prev, [itemId]: res.data.reactionId }));
    } catch {
      // keep optimistic state on error
    }
  };

  const handleVerifyMe = () => {
    setFeedItems((prev) => {
      const meIndex = prev.findIndex((item) => item.isMe);
      const verifiedMe: Partial<FeedItem> = {
        isVerified: true,
        isGoalAchieved: true,
        photoSource: VERIFIED_ME_PHOTO,
        postText: '오늘 인증 완료했어요!',
        screenTime: '2h 30m',
      };
      if (meIndex !== -1) {
        return prev.map((item, i) => (i === meIndex ? { ...item, ...verifiedMe } : item));
      }
      // Real-API mode: current user not yet in the list — prepend a mock card
      const mockMe: FeedItem = {
        id: 'dev-me',
        name: '나',
        isMe: true,
        avatarSource: AVATAR_SRC,
        commentCount: 0,
        reactionCount: 0,
        pokeCount: 0,
        reactions: [],
        pokes: [],
        ...verifiedMe,
      } as FeedItem;
      return [mockMe, ...prev];
    });
  };

  return (
    <View style={styles.root}>
      <FeedHeader groupName={group?.name} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : effectiveGroupActive ? (
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
          onGoalSet={() => setGoalState('setWaiting')}
          onNextDay={() => setGoalState('authReady')}
          onVerifyMe={handleVerifyMe}
        />
      ) : (
        <InactiveFeed onInvite={handleInvite} onDevActivateGroup={() => setDevGroupActive(true)} />
      )}
    </View>
  );
}

// isGroupActive = false 일 때 렌더링
function InactiveFeed({
  onInvite,
  onDevActivateGroup,
}: {
  onInvite: () => void;
  onDevActivateGroup: () => void;
}) {
  return (
    <View style={styles.container}>
      <EmptyFeedCard onInvite={onInvite} />
      <DevPanel goalState="notSet" onNextDay={() => {}} onActivateGroup={onDevActivateGroup} />
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
  onGoalSet,
  onNextDay,
  onVerifyMe,
}: {
  onInvite: () => void;
  onPoke: (memberId: string) => void;
  onReact: (itemId: string, emoji: string) => void;
  feedItems: FeedItem[];
  members: MemberItem[];
  myReactions: Record<string, string>;
  pokedMemberIds: string[];
  goalState: GoalState;
  groupChallengeId: string | null;
  onGoalSet: () => void;
  onNextDay: () => void;
  onVerifyMe: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const enrichedMembers = members.map((m) => ({
    ...m,
    isGoalAchieved: feedItems.some((f) => f.id === m.id && f.isVerified && f.isGoalAchieved),
  }));

  return (
    <View style={styles.feedWrapper}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ActionGuideBanner goalState={goalState} onGoalSet={onGoalSet} />
        <MemberSection members={enrichedMembers} onInvite={onInvite} />
        {feedItems.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            goalState={goalState}
            onPoke={onPoke}
            onReact={onReact}
            isPoked={pokedMemberIds.includes(item.id)}
            myReaction={myReactions[item.id]}
            onBodyPress={() =>
              router.push({
                pathname: '/(feed)/post-detail',
                params: {
                  item: JSON.stringify(item),
                  goalState,
                  isPoked: pokedMemberIds.includes(item.id) ? '1' : '0',
                  myReaction: myReactions[item.id] ?? '',
                  groupChallengeId: groupChallengeId ?? '',
                },
              })
            }
          />
        ))}
        <DevPanel goalState={goalState} onNextDay={onNextDay} onVerifyMe={onVerifyMe} />
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      >
        <Image
          source={require('../../../assets/icons/regular/icon_rg_ArrowUp.png')}
          style={styles.fabIcon}
          resizeMode="contain"
        />
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
        leadingIcon={
          <Image
            source={require('../../../assets/icons/regular/icon_rg_ShareFat.png')}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        }
        onPress={onInvite}
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}

function DevPanel({
  goalState,
  onNextDay,
  onActivateGroup,
  onVerifyMe,
}: {
  goalState: GoalState;
  onNextDay: () => void;
  onActivateGroup?: () => void;
  onVerifyMe?: () => void;
}) {
  const showNextDay = goalState === 'setWaiting';
  const showActivate = !!onActivateGroup;
  const showVerifyMe = !!onVerifyMe && goalState === 'authReady';
  if (!showNextDay && !showActivate && !showVerifyMe) return null;

  return (
    <View style={devStyles.panel}>
      {showNextDay && (
        <Pressable style={devStyles.button} onPress={onNextDay}>
          <Text style={devStyles.label}>[임시] 하루 경과</Text>
        </Pressable>
      )}
      {showActivate && (
        <Pressable style={devStyles.button} onPress={onActivateGroup}>
          <Text style={devStyles.label}>[임시] 그룹 활성화 (2명 참여)</Text>
        </Pressable>
      )}
      {showVerifyMe && (
        <Pressable style={devStyles.button} onPress={onVerifyMe}>
          <Text style={devStyles.label}>[임시] 내가 인증 완료</Text>
        </Pressable>
      )}
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
  fabIcon: {
    width: 20,
    height: 20,
    tintColor: WHITE,
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
  buttonIcon: {
    width: 20,
    height: 20,
  },
});

const devStyles = StyleSheet.create({
  panel: {
    gap: spacing[8],
    alignItems: 'center',
    marginTop: spacing[8],
  },
  button: {
    borderWidth: 1,
    borderColor: gray[300],
    borderRadius: radius[8],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
  },
  label: {
    ...typography.primary.body3R,
    color: gray[400],
  },
});
