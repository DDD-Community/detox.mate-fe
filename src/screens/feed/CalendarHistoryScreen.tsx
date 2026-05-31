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
import { Icon } from '../../components/Icon';
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

type GroupChallengeResponse = {
  startAt?: string | null;
  endAt?: string | null;
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

function parseDateParam(dateStr?: string): string | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayString(): string {
  return shiftDate(todayString(), -1);
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
  const {
    date: paramDate,
    groupChallengeId,
    startDate: paramStartDate,
    endDate: paramEndDate,
  } = useLocalSearchParams<{
    date: string;
    groupChallengeId: string;
    startDate?: string;
    endDate?: string;
  }>();

  const [date, setDate] = useState(paramDate ?? todayString());
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstSelectableDate, setFirstSelectableDate] = useState<string | null>(
    parseDateParam(paramStartDate)
  );
  const [lastSelectableDate, setLastSelectableDate] = useState(() => {
    const parsedEndDate = parseDateParam(paramEndDate);
    const yesterday = yesterdayString();
    return parsedEndDate && parsedEndDate < yesterday ? parsedEndDate : yesterday;
  });

  const today = todayString();
  const isAtOrBeforeFirstDate = firstSelectableDate != null && date <= firstSelectableDate;
  const isAtOrAfterLastDate = date >= lastSelectableDate || date >= today;

  useEffect(() => {
    if (!groupChallengeId || firstSelectableDate) return;

    const fetchChallengeRange = async () => {
      try {
        const res = await apiClient.get<GroupChallengeResponse>(
          `/group-challenges/${groupChallengeId}`
        );
        const startDate = parseDateParam(res.data.startAt ?? undefined);
        const endDate = parseDateParam(res.data.endAt ?? undefined);
        const yesterday = yesterdayString();

        if (startDate) {
          setFirstSelectableDate(startDate);
        }
        if (endDate && endDate < yesterday) {
          setLastSelectableDate(endDate);
        }
      } catch {
        // keep navigation range from params/defaults
      }
    };

    fetchChallengeRange();
  }, [firstSelectableDate, groupChallengeId]);

  useEffect(() => {
    if (firstSelectableDate && date < firstSelectableDate) {
      setDate(firstSelectableDate);
      return;
    }
    if (date > lastSelectableDate) {
      setDate(lastSelectableDate);
    }
  }, [date, firstSelectableDate, lastSelectableDate]);

  useEffect(() => {
    if (!groupChallengeId) return;
    if (firstSelectableDate && date < firstSelectableDate) return;
    if (date > lastSelectableDate) return;

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
  }, [date, firstSelectableDate, groupChallengeId, lastSelectableDate]);

  const goTo = (newDate: string) => {
    if (firstSelectableDate && newDate < firstSelectableDate) return;
    if (newDate > lastSelectableDate) return;

    setDate(newDate);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="caretLeft" size={20} color={gray[900]} />
        </TouchableOpacity>

        <View style={styles.dateNav}>
          <TouchableOpacity
            style={[styles.arrowBtn, isAtOrBeforeFirstDate && styles.arrowDisabled]}
            disabled={isAtOrBeforeFirstDate}
            onPress={() => goTo(shiftDate(date, -1))}
          >
            <Icon name="caretLeft" size={20} color={gray[900]} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <TouchableOpacity
            style={[styles.arrowBtn, isAtOrAfterLastDate && styles.arrowDisabled]}
            disabled={isAtOrAfterLastDate}
            onPress={() => goTo(shiftDate(date, 1))}
          >
            <Icon name="caretRight" size={20} color={gray[900]} />
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
            <FeedCard key={item.id} item={item} goalState="authReady" historyMode={true} />
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
