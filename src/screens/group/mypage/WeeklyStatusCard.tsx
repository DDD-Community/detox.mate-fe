import { StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, spacing, typography } from '../../../lib/token';

const { brown, gray, green, system } = primitiveColors;
const RED = system.red.opacity100;

export interface WeeklyStatusCardProps {
  weekLabel: string;
  /** 목표 대비 차이(분). 음수=절약, 양수=초과 */
  diffMinutes: number;
  avgScreenTime: string;
  goalScreenTime: string;
  verifiedDays: number;
  totalVerifyDays: number;
  achievedDays: number;
  achievableDays: number;
}

const formatDiff = (minutes: number) => {
  const sign = minutes >= 0 ? '+' : '-';
  return `${sign}${Math.abs(minutes)}m`;
};

export function WeeklyStatusCard({
  weekLabel,
  diffMinutes,
  avgScreenTime,
  goalScreenTime,
  verifiedDays,
  totalVerifyDays,
  achievedDays,
  achievableDays,
}: WeeklyStatusCardProps) {
  const isSaved = diffMinutes < 0;
  const diffColor = isSaved ? green[300] : RED;
  const diffLabel = isSaved ? '목표보다 절약' : '목표보다 초과';
  const diffLabelColor = isSaved ? gray[500] : RED;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>이번 주 현황</Text>
        <Text style={styles.week}>{weekLabel}</Text>
      </View>

      <View style={styles.donutWrap}>
        <View style={[styles.donutOuter, { backgroundColor: diffColor }]}>
          {/* TODO: 진행률 호 표시 — react-native-svg 도입 후 구현 */}
          <View style={styles.donutInner}>
            <Text style={[styles.diffValue, { color: diffColor }]}>
              {formatDiff(diffMinutes)}
            </Text>
            <Text style={[styles.diffLabel, { color: diffLabelColor }]}>{diffLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsBlock}>
        <View style={styles.statRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>평균 스크린 타임</Text>
            <Text style={styles.statPrimary}>
              {avgScreenTime}/{goalScreenTime}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabelLight}>인증</Text>
            <Text style={styles.statSecondary}>
              {verifiedDays}/{totalVerifyDays}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabelLight}>달성</Text>
            <Text style={[styles.statSecondary, { color: green[300] }]}>
              {achievedDays}/{achievableDays}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius[16],
    borderWidth: 0.5,
    borderColor: '#F0F1F3',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.primary.body2B,
    color: gray[800],
  },
  week: {
    ...typography.primary.body3R,
    color: gray[300],
  },
  donutWrap: {
    alignItems: 'center',
    paddingTop: spacing[12],
  },
  donutOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffValue: {
    ...typography.accent.h2,
  },
  diffLabel: {
    ...typography.primary.body3R,
    textAlign: 'center',
  },
  statsBlock: {
    paddingTop: spacing[16],
    gap: spacing[12],
  },
  statRow: {
    flexDirection: 'row',
  },
  statCol: {
    flex: 1,
    gap: spacing[4],
  },
  statLabel: {
    ...typography.primary.body3B,
    color: brown[900],
  },
  statLabelLight: {
    ...typography.primary.body3R,
    color: brown[900],
  },
  statPrimary: {
    ...typography.primary.title1B,
    color: gray[900],
  },
  statSecondary: {
    ...typography.primary.title2B,
    color: gray[800],
  },
  divider: {
    height: 0.5,
    backgroundColor: '#F0F1F3',
  },
});
