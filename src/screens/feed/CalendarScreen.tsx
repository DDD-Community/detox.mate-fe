import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import apiClient from '../../api/client';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { gray, green, brown, system } = primitiveColors;
const WHITE = '#FFFFFF';
const CALENDAR_RED = '#EF3024';
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

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

type GroupChallengeResponse = {
  startAt?: string | null;
  endAt?: string | null;
};

type CalendarDay = {
  date: Date;
  day: number;
  key: string;
};

function getYesterday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  return date;
}

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateParam(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isAfterDate(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

function isBeforeDate(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

function earlierDate(a: Date, b: Date): Date {
  return isBeforeDate(a, b) ? a : b;
}

function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  if (isBeforeDate(date, minDate)) return minDate;
  if (isAfterDate(date, maxDate)) return maxDate;
  return date;
}

function getCalendarRows(month: Date): (CalendarDay | null)[][] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (CalendarDay | null)[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(year, monthIndex, day);
    date.setHours(0, 0, 0, 0);
    cells.push({ date, day, key: formatDateParam(date) });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function getMonthTitle(month: Date): string {
  return month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function CalendarScreen() {
  const { groupChallengeId } = useLocalSearchParams<{ groupChallengeId: string }>();
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [yesterday] = useState(getYesterday);
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(yesterday));
  const [firstActiveDate, setFirstActiveDate] = useState<Date | null>(null);
  const [lastActiveDate, setLastActiveDate] = useState(yesterday);

  useEffect(() => {
    if (!groupChallengeId) return;
    const fetch = async () => {
      try {
        const [res, challengeRes] = await Promise.all([
          apiClient.get<CalendarResponse>(
            `/group-challenges/${groupChallengeId}/activity-calendar`
          ),
          apiClient
            .get<GroupChallengeResponse>(`/group-challenges/${groupChallengeId}`)
            .catch(() => null),
        ]);
        setCalendarData(res.data);
        const challengeStartDate = parseDateParam(challengeRes?.data.startAt ?? undefined);
        const summaryStartDate = parseDateParam(res.data.summary?.startDate);
        const challengeEndDate = parseDateParam(challengeRes?.data.endAt ?? undefined);
        const minDate = challengeStartDate ?? summaryStartDate ?? yesterday;
        const maxDate = challengeEndDate ? earlierDate(challengeEndDate, yesterday) : yesterday;
        const nextSelectedDate = clampDate(maxDate, minDate, maxDate);

        setFirstActiveDate(minDate);
        setLastActiveDate(maxDate);
        if (nextSelectedDate) {
          setSelectedDate(nextSelectedDate);
          setVisibleMonth(startOfMonth(nextSelectedDate));
        }
      } catch {
        // keep empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [groupChallengeId]);

  const handleDatePress = (date: Date) => {
    if (
      !firstActiveDate ||
      isBeforeDate(date, firstActiveDate) ||
      isAfterDate(date, lastActiveDate)
    ) {
      return;
    }

    setSelectedDate(date);
    router.push({
      pathname: '/(feed)/calendar-history',
      params: {
        date: formatDateParam(date),
        groupChallengeId: groupChallengeId ?? '',
        startDate: formatDateParam(firstActiveDate),
        endDate: formatDateParam(lastActiveDate),
      },
    });
  };

  const calendarRows = getCalendarRows(visibleMonth);
  const previousMonth = addMonths(visibleMonth, -1);
  const nextMonth = addMonths(visibleMonth, 1);
  const canGoPreviousMonth = firstActiveDate
    ? !isBeforeDate(previousMonth, startOfMonth(firstActiveDate))
    : true;
  const canGoNextMonth = !isAfterDate(nextMonth, startOfMonth(lastActiveDate));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Icon name="caretLeft" size={24} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle}>캘린더</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={gray[400]} style={styles.loading} />
        ) : (
          <>
            <View style={styles.streakCard} pointerEvents="none">
              <View style={styles.streakLeft}>
                <Text style={styles.streakLabel}>🔥 그룹 스트릭</Text>
                <Text style={styles.streakSub}>멤버 절반 이상이 인증한 날만 카운트돼요</Text>
              </View>
              <View style={styles.streakCountWrap}>
                <Text style={styles.streakCount}>{calendarData?.streakDays ?? 0}</Text>
                <Text style={styles.streakUnit}>일 연속</Text>
              </View>
            </View>

            <View style={styles.statsRow} pointerEvents="none">
              <View style={styles.statBox}>
                <Text style={[styles.statValue, styles.statAll]}>
                  {calendarData?.summary.allCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>전원 인증</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, styles.statHalf]}>
                  {calendarData?.summary.halfCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>절반 인증</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, styles.statReset]}>
                  {calendarData?.summary.resetCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>리셋</Text>
              </View>
            </View>

            <View style={styles.calendarSection}>
              <View style={styles.monthHeader}>
                <View style={styles.monthTitleWrap}>
                  <Text style={styles.monthTitle}>{getMonthTitle(visibleMonth)}</Text>
                  <Icon name="caretRight" size={18} color={CALENDAR_RED} weight="bold" />
                </View>
                <View style={styles.monthActions}>
                  <Pressable
                    onPress={() => setVisibleMonth(previousMonth)}
                    disabled={!canGoPreviousMonth}
                    hitSlop={10}
                    style={[styles.monthAction, !canGoPreviousMonth && styles.monthActionDisabled]}
                  >
                    <Icon name="caretLeft" size={28} color={CALENDAR_RED} weight="bold" />
                  </Pressable>
                  <Pressable
                    onPress={() => setVisibleMonth(nextMonth)}
                    disabled={!canGoNextMonth}
                    hitSlop={10}
                    style={[styles.monthAction, !canGoNextMonth && styles.monthActionDisabled]}
                  >
                    <Icon name="caretRight" size={28} color={CALENDAR_RED} weight="bold" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.weekRow}>
                {WEEKDAYS.map((weekday) => (
                  <Text key={weekday} style={styles.weekday}>
                    {weekday}
                  </Text>
                ))}
              </View>

              <View style={styles.dateGrid}>
                {calendarRows.map((row, rowIndex) => (
                  <View key={`${visibleMonth.toISOString()}-${rowIndex}`} style={styles.dateRow}>
                    {row.map((day, dayIndex) => {
                      if (!day) {
                        return <View key={`empty-${dayIndex}`} style={styles.dateCell} />;
                      }

                      const disabled =
                        !firstActiveDate ||
                        isBeforeDate(day.date, firstActiveDate) ||
                        isAfterDate(day.date, lastActiveDate);
                      const selected = !disabled && isSameDate(day.date, selectedDate);

                      return (
                        <Pressable
                          key={day.key}
                          onPress={() => handleDatePress(day.date)}
                          disabled={disabled}
                          style={styles.dateCell}
                        >
                          <View style={[styles.dateCircle, selected && styles.dateCircleSelected]}>
                            <Text
                              style={[
                                styles.dateText,
                                selected && styles.dateTextSelected,
                                disabled && styles.dateTextDisabled,
                              ]}
                            >
                              {day.day}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[40],
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    gap: spacing[16],
    backgroundColor: brown[50],
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
    letterSpacing: -0.4,
  },
  loading: {
    marginTop: spacing[32],
  },
  streakCard: {
    marginHorizontal: spacing[16],
    marginTop: spacing[20],
    backgroundColor: green[300],
    borderRadius: 24,
    padding: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 82,
  },
  streakLeft: {
    flex: 1,
    gap: spacing[8],
  },
  streakLabel: {
    ...typography.primary.body3B,
    color: WHITE,
    letterSpacing: -0.24,
  },
  streakSub: {
    ...typography.primary.caption,
    color: WHITE,
    letterSpacing: -0.22,
  },
  streakCountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[4],
    marginLeft: spacing[12],
  },
  streakCount: {
    ...typography.accent.h2,
    color: WHITE,
    letterSpacing: -0.6,
  },
  streakUnit: {
    ...typography.accent.title1,
    color: WHITE,
    letterSpacing: -0.44,
  },
  statsRow: {
    marginHorizontal: spacing[16],
    marginTop: 22,
    flexDirection: 'row',
    gap: spacing[8],
  },
  statBox: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 24,
    alignItems: 'center',
    padding: spacing[12],
    gap: spacing[4],
  },
  statValue: {
    ...typography.accent.h3,
    letterSpacing: -0.52,
  },
  statAll: {
    color: system.green.opacity100,
  },
  statHalf: {
    color: system.orange.opacity100,
  },
  statReset: {
    color: system.red.opacity100,
  },
  statLabel: {
    ...typography.primary.body3B,
    color: gray[500],
    letterSpacing: -0.24,
  },
  calendarSection: {
    marginTop: spacing[36],
    paddingHorizontal: spacing[24],
  },
  monthHeader: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  monthTitle: {
    ...typography.primary.body1B,
    color: '#111111',
    letterSpacing: -0.32,
  },
  monthActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[20],
  },
  monthAction: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthActionDisabled: {
    opacity: 0.25,
  },
  weekRow: {
    marginTop: spacing[20],
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    ...typography.primary.body3B,
    color: '#C5C5C5',
    textAlign: 'center',
    letterSpacing: -0.24,
  },
  dateGrid: {
    marginTop: spacing[8],
  },
  dateRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCell: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: CALENDAR_RED,
  },
  dateText: {
    ...typography.primary.title1M,
    color: '#111111',
    textAlign: 'center',
  },
  dateTextSelected: {
    color: WHITE,
  },
  dateTextDisabled: {
    color: gray[200],
  },
});
