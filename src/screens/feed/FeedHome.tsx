import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import ActionGuideBanner, { type GoalState } from './ActionGuideBanner';
import FeedCard, { type FeedItem } from './FeedCard';
import FeedHeader from './FeedHeader';
import { MOCK_COMMENTS } from './FeedPostDetail';
import MemberSection, { type MemberItem } from './MemberSection';

const { brown, gray, green } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SRC = require('../../../assets/basic-profile-turtle-hi.png');

const INITIAL_MEMBERS: MemberItem[] = [
  { id: '1', name: '나', avatarSource: AVATAR_SRC },
  { id: '2', name: '지수', avatarSource: AVATAR_SRC },
  { id: '3', name: '민준', avatarSource: AVATAR_SRC },
  { id: '4', name: '서연', avatarSource: AVATAR_SRC },
  { id: '5', name: '승호', avatarSource: AVATAR_SRC },
  { id: '6', name: '현우', avatarSource: AVATAR_SRC },
];

const FEED_UNVERIFIED: FeedItem[] = [
  {
    id: '1',
    name: '나',
    isMe: true,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '2',
    name: '지수',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '3',
    name: '민준',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '4',
    name: '서연',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '5',
    name: '승호',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '6',
    name: '현우',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
];

const FEED_AUTH_READY: FeedItem[] = [
  {
    id: '2',
    name: '지수',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 22,
    isVerified: true,
    verifiedTimeAgo: '2시간 전',
    isGoalAchieved: true,
    photoSource: require('../../../assets/turtle-hi.png'),
    postText: '2시간동안 런닝 뛰고 온 날!',
    screenTime: '1h 10m',
  },
  {
    id: '3',
    name: '민준',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 22,
    isVerified: true,
    verifiedTimeAgo: '5시간 전',
    isGoalAchieved: false,
    retroText: '릴스 무한루프에 빠졌어요... 내일은 폰 도서관 사물함에 넣어둘게요 ㅠㅠ',
    screenTime: '6h 5m',
  },
  {
    id: '1',
    name: '나',
    isMe: true,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '4',
    name: '서연',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '5',
    name: '승호',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
  {
    id: '6',
    name: '현우',
    isMe: false,
    avatarSource: AVATAR_SRC,
    commentCount: MOCK_COMMENTS.length,
    reactionCount: 0,
    isVerified: false,
  },
];

type GroupInfo = {
  id: string;
  name: string;
  inviteCode: string;
  members: unknown[];
};

export default function FeedHome() {
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalState, setGoalState] = useState<GoalState>('notSet');
  const [devGroupActive, setDevGroupActive] = useState(false);
  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(FEED_UNVERIFIED);
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [pokedMemberIds, setPokedMemberIds] = useState<string[]>([]);

  const effectiveGroupActive = isGroupActive || devGroupActive;

  useEffect(() => {
    setFeedItems(goalState === 'authReady' ? [...FEED_AUTH_READY] : [...FEED_UNVERIFIED]);
    setMyReactions({});
  }, [goalState]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await apiClient.get<GroupInfo[]>('/me/groups');
        const groups = res.data;
        if (groups.length > 0) {
          const g = groups[0];
          setGroup(g);
          setIsGroupActive(g.members.length >= 2);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, []);

  const handleInvite = async () => {
    if (!group) return;
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${group.inviteCode}`,
    });
  };

  const handlePoke = async (memberId: string) => {
    setPokedMemberIds((prev) => [...prev, memberId]);
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, badgeCount: (m.badgeCount ?? 0) + 1 } : m))
    );
    if (!group) return;
    try {
      await apiClient.post(`/me/groups/${group.id}/members/${memberId}/poke`);
    } catch {
      // 임시 연결 — 에러 무시
    }
  };

  const handleReact = (itemId: string, emoji: string) => {
    if (!myReactions[itemId]) {
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, reactionCount: item.reactionCount + 1 } : item
        )
      );
    }
    setMyReactions((prev) => ({ ...prev, [itemId]: emoji }));
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
          onGoalSet={() => setGoalState('setWaiting')}
          onNextDay={() => setGoalState('authReady')}
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
  onGoalSet,
  onNextDay,
}: {
  onInvite: () => void;
  onPoke: (memberId: string) => void;
  onReact: (itemId: string, emoji: string) => void;
  feedItems: FeedItem[];
  members: MemberItem[];
  myReactions: Record<string, string>;
  pokedMemberIds: string[];
  goalState: GoalState;
  onGoalSet: () => void;
  onNextDay: () => void;
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
                },
              })
            }
          />
        ))}
        <DevPanel goalState={goalState} onNextDay={onNextDay} />
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
}: {
  goalState: GoalState;
  onNextDay: () => void;
  onActivateGroup?: () => void;
}) {
  const showNextDay = goalState === 'setWaiting';
  const showActivate = !!onActivateGroup;
  if (!showNextDay && !showActivate) return null;

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
