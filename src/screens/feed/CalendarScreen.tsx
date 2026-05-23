import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '../../components/Icon';
import apiClient from '../../api/client';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { gray, green, brown, system } = primitiveColors;
const WHITE = '#FFFFFF';

type CalendarResponse = {
  groupId: number;
  streakDays: number;
  summary: {
    startDate: string;
    endDate: string;
    allCount: number;
    halfCount: number;
    resetCount: number;
  };
};

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarScreen() {
  const { groupChallengeId } = useLocalSearchParams<{ groupChallengeId: string }>();
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [selectedDate, setSelectedDate] = useState(yesterday);

  useEffect(() => {
    if (!groupChallengeId) return;
    const fetch = async () => {
      try {
        const res = await apiClient.get<CalendarResponse>(
          `/group-challenges/${groupChallengeId}/activity-calendar`
        );
        setCalendarData(res.data);
      } catch {
        // keep empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [groupChallengeId]);

  const handleDateChange = (_: unknown, date?: Date) => {
    if (!date) return;
    setSelectedDate(date);
    router.push({
      pathname: '/(feed)/calendar-history',
      params: {
        date: formatDateParam(date),
        groupChallengeId: groupChallengeId ?? '',
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
        <Text style={styles.headerTitle}>캘린더</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={gray[400]} style={{ marginTop: spacing[32] }} />
      ) : (
        <>
          {/* Streak Card */}
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakLabel}>🔥 그룹 스트릭</Text>
              <Text style={styles.streakSub}>멤버 절반 이상이 인증한 날만 카운트돼요</Text>
            </View>
            <Text style={styles.streakCount}>
              {calendarData?.streakDays ?? 0}
              <Text style={styles.streakUnit}> 일 연속</Text>
            </Text>
          </View>

          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{calendarData?.summary.allCount ?? 0}</Text>
              <Text style={styles.statLabel}>전원 인증</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={[styles.statValue, { color: system.green.opacity100 }]}>
                {calendarData?.summary.halfCount ?? 0}
              </Text>
              <Text style={styles.statLabel}>절반 인증</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: system.red.opacity100 }]}>
                {calendarData?.summary.resetCount ?? 0}
              </Text>
              <Text style={styles.statLabel}>리셋</Text>
            </View>
          </View>

          {/* Native iOS Calendar */}
          <View style={styles.calendarWrapper}>
            <DateTimePicker
              mode="date"
              display="inline"
              value={selectedDate}
              onChange={handleDateChange}
              maximumDate={yesterday}
              accentColor={green[300]}
              style={styles.calendar}
            />
          </View>
        </>
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
    paddingTop: spacing[56],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[12],
    gap: spacing[8],
    backgroundColor: brown[50],
  },
  backBtn: {
    padding: spacing[4],
  },
  headerTitle: {
    ...typography.primary.body1B,
    color: gray[900],
  },
  streakCard: {
    marginHorizontal: spacing[16],
    marginTop: spacing[8],
    backgroundColor: green[300],
    borderRadius: radius[16],
    padding: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flex: 1,
    gap: spacing[4],
  },
  streakLabel: {
    ...typography.primary.body2B,
    color: WHITE,
  },
  streakSub: {
    ...typography.primary.caption,
    color: WHITE,
    opacity: 0.85,
  },
  streakCount: {
    ...typography.primary.title1B,
    color: WHITE,
    fontSize: 28,
  },
  streakUnit: {
    ...typography.primary.body2R,
    color: WHITE,
    fontSize: 16,
  },
  statsRow: {
    marginHorizontal: spacing[16],
    marginTop: spacing[12],
    backgroundColor: WHITE,
    borderRadius: radius[16],
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[16],
    gap: spacing[4],
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: gray[100],
  },
  statValue: {
    ...typography.primary.body1B,
    color: gray[900],
    fontSize: 22,
  },
  statLabel: {
    ...typography.primary.caption,
    color: gray[500],
  },
  calendarWrapper: {
    marginHorizontal: spacing[16],
    marginTop: spacing[12],
    backgroundColor: WHITE,
    borderRadius: radius[16],
    overflow: 'hidden',
    alignItems: 'center',
  },
  calendar: {
    width: '100%',
    alignSelf: 'center',
  },
});
