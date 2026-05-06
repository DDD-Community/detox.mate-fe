import { useEffect, useState } from 'react';
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
import MemberSection, { type MemberItem } from './MemberSection';

const { brown, gray } = primitiveColors;

const INITIAL_MEMBERS: MemberItem[] = [
  { id: '1', name: '나', avatarSource: require('../../../assets/basic-profile-turtle-hi.png') },
  {
    id: '2',
    name: '서연',
    avatarSource: require('../../../assets/basic-profile-turtle-hi.png'),
    badgeCount: 20,
  },
];

const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    name: '나',
    isMe: true,
    avatarSource: require('../../../assets/basic-profile-turtle-hi.png'),
    commentCount: 10,
  },
  {
    id: '2',
    name: '서연',
    isMe: false,
    avatarSource: require('../../../assets/basic-profile-turtle-hi.png'),
    commentCount: 10,
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

  const effectiveGroupActive = isGroupActive || devGroupActive;

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
          members={members}
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
  members,
  goalState,
  onGoalSet,
  onNextDay,
}: {
  onInvite: () => void;
  onPoke: (memberId: string) => void;
  members: MemberItem[];
  goalState: GoalState;
  onGoalSet: () => void;
  onNextDay: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ActionGuideBanner goalState={goalState} onGoalSet={onGoalSet} />
      <MemberSection members={members} onInvite={onInvite} />
      {MOCK_FEED.map((item) => (
        <FeedCard key={item.id} item={item} goalState={goalState} onPoke={onPoke} />
      ))}
      <DevPanel goalState={goalState} onNextDay={onNextDay} />
    </ScrollView>
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
            source={require('../../../assets/onboarding-share-white.png')}
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
  container: {
    // paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    gap: spacing[12],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
    gap: spacing[16],
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
  emptyTitle: {
    ...typography.primary.body1B,
    color: gray[900],
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
