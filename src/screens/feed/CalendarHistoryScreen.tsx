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
import type { GroupChallengeRecordFeedResponse, MemberResponse } from '../../api/generated/model';
import { memberStore } from '../../lib/memberStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import FeedCard, { type FeedItem, type PokeEntry, type ReactionEntry } from './FeedCard';

const { gray, brown } = primitiveColors;

type GroupChallengeResponse = {
  startAt?: string | null;
  endAt?: string | null;
};

const AVATAR_SRC = require('../../../assets/basic-profile-turtle-hi.png');
const EMPTY_REACTIONS: ReactionEntry[] = [];
const EMPTY_POKES: PokeEntry[] = [];

function formatMinutes(minutes: number | null | undefined): string | undefined {
  if (minutes == null) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function mapMemberToFeedItem(m: MemberResponse): FeedItem {
  const isVerified = m.activityRecord != null;
  const isGoalAchieved = m.activityRecord?.allAchieved === true;
  const activityImageUrl = m.activityRecord?.activityImageUrl;
  const hasActivityImage = activityImageUrl != null && activityImageUrl.length > 0;
  const totalUsage = m.activityRecord?.details?.find((d) => d.usageGoalType === 'TOTAL_USAGE');
  return {
    id: String(m.userId ?? ''),
    challengeRecordId: m.challengeRecordId,
    name: m.displayName ?? '',
    isMe: m.isMe === true,
    avatarSource: m.profileImageUrl ? { uri: m.profileImageUrl } : AVATAR_SRC,
    commentCount: m.commentCount ?? 0,
    reactionCount: m.reactionCount ?? 0,
    pokeCount: m.pokeCount ?? 0,
    reactions: EMPTY_REACTIONS,
    pokes: EMPTY_POKES,
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
  };
}

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
        const res = await apiClient.get<GroupChallengeRecordFeedResponse>(
          `/group-challenges/${groupChallengeId}/challenge-records`,
          { params: { date } }
        );
        const members = res.data.members ?? [];
        const score = (m: (typeof members)[number]) => {
          if (m.activityRecord != null) return 2;
          if ((m.reactionCount ?? 0) > 0 || (m.commentCount ?? 0) > 0) return 1;
          return 0;
        };
        const deduped = members
          .filter((m) => !m.isUserWithdrawn)
          .reduce<typeof members>((acc, m) => {
            const idx = acc.findIndex((e) => e.userId === m.userId);
            if (idx === -1) return [...acc, m];
            if (score(m) > score(acc[idx])) {
              const next = [...acc];
              next[idx] = m;
              return next;
            }
            return acc;
          }, []);
        setItems(deduped.map(mapMemberToFeedItem));
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

  const openMemberProfile = (item: FeedItem) => {
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
  };

  const openPostDetail = (item: FeedItem) => {
    router.push({
      pathname: '/(feed)/post-detail',
      params: {
        item: JSON.stringify(item),
        goalState: 'authReady',
        isPoked: '0',
        myReaction: '',
        groupChallengeId: groupChallengeId ?? '',
        fromFeedHome: '1',
        readOnly: '1',
      },
    });
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
          {items.map((item, idx) => (
            <FeedCard
              key={`${idx}-${item.id}`}
              item={item}
              goalState="authReady"
              historyMode={true}
              onBodyPress={() => openPostDetail(item)}
              onProfilePress={() => openMemberProfile(item)}
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
