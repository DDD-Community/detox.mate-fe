import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../../api/client';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import FeedCard, { type FeedItem, type PokeEntry, type ReactionEntry } from './FeedCard';

const { gray, brown } = primitiveColors;

type ChallengeRecord = {
  challengeRecordId: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  isMe: boolean;
  isVerified: boolean;
  isGoalAchieved?: boolean;
  verifiedTimeAgo?: string;
  photoUrl?: string;
  postText?: string;
  retroText?: string;
  screenTime?: string;
  commentCount: number;
  reactionCount: number;
  pokeCount: number;
};

const AVATAR_SRC = require('../../../assets/basic-profile-turtle-hi.png');
const EMPTY_REACTIONS: ReactionEntry[] = [];
const EMPTY_POKES: PokeEntry[] = [];

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const yy = String(y).slice(2);
  return `${yy}년 ${Number(m)}월 ${Number(d)}일`;
}

function shiftDate(dateStr: string, delta: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + delta);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function recordToFeedItem(r: ChallengeRecord): FeedItem {
  return {
    id: String(r.challengeRecordId),
    challengeRecordId: r.challengeRecordId,
    name: r.name,
    isMe: r.isMe,
    avatarSource: r.avatarUrl ? { uri: r.avatarUrl } : AVATAR_SRC,
    commentCount: r.commentCount,
    reactionCount: r.reactionCount,
    pokeCount: r.pokeCount,
    reactions: EMPTY_REACTIONS,
    pokes: EMPTY_POKES,
    isVerified: r.isVerified,
    isGoalAchieved: r.isGoalAchieved,
    verifiedTimeAgo: r.verifiedTimeAgo,
    photoSource: r.photoUrl ? { uri: r.photoUrl } : undefined,
    postText: r.postText,
    retroText: r.retroText,
    screenTime: r.screenTime,
  };
}

export default function CalendarHistoryScreen() {
  const { date: paramDate, groupChallengeId } = useLocalSearchParams<{
    date: string;
    groupChallengeId: string;
  }>();

  const [date, setDate] = useState(paramDate ?? todayString());
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const today = todayString();
  const isToday = date >= today;

  useEffect(() => {
    if (!groupChallengeId) return;
    setLoading(true);
    const fetch = async () => {
      try {
        const res = await apiClient.get<ChallengeRecord[]>(
          `/group-challenges/${groupChallengeId}/challenge-records`,
          { params: { date } }
        );
        setItems(res.data.map(recordToFeedItem));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [date, groupChallengeId]);

  const goTo = (newDate: string) => {
    setDate(newDate);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Image
            source={require('../../../assets/icons/regular/icon_rg_CaretLeft.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => goTo(shiftDate(date, -1))}>
            <Image
              source={require('../../../assets/icons/regular/icon_rg_CaretLeft.png')}
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <TouchableOpacity
            style={[styles.arrowBtn, isToday && styles.arrowDisabled]}
            disabled={isToday}
            onPress={() => goTo(shiftDate(date, 1))}
          >
            <Image
              source={require('../../../assets/icons/regular/icon_rg_CaretRight.png')}
              style={[styles.navIcon, isToday && styles.iconDisabled]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator color={gray[400]} style={{ marginTop: spacing[32] }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>이 날의 인증 기록이 없어요</Text>
        </View>
      ) : (
        <View style={styles.feedList}>
          {items.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              goalState="authReady"
              historyMode={true}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  content: {
    paddingBottom: spacing[40],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[56],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[12],
    backgroundColor: brown[50],
  },
  backBtn: {
    width: 28,
    alignItems: 'center',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  arrowBtn: {
    padding: spacing[4],
  },
  arrowDisabled: {
    opacity: 0,
  },
  navIcon: {
    width: 20,
    height: 20,
  },
  iconDisabled: {
    opacity: 0.3,
  },
  dateText: {
    ...typography.primary.body1B,
    color: gray[900],
  },
  feedList: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[8],
    gap: spacing[12],
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing[64],
  },
  emptyText: {
    ...typography.primary.body2R,
    color: gray[400],
  },
});
