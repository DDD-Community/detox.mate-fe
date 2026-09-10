import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray, green, brown } = primitiveColors;

const RING_SIZE = 220;
const RING_STROKE = 16;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatDuration = (minutes: number) => {
  const clamped = Math.max(minutes, 0);
  const hours = Math.floor(clamped / 60);
  const rest = clamped % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

const formatTodayLabel = () => {
  const now = new Date();
  return `오늘, ${now.getMonth() + 1}월 ${now.getDate()}일`;
};

export default function LockStatusScreen() {
  const router = useRouter();
  const { targetMinutes, lockedApps } = useLockStore();

  const totalUsedMinutes = lockedApps.reduce((sum, app) => sum + app.usedMinutes, 0);
  const remainingMinutes = Math.max(targetMinutes - totalUsedMinutes, 0);
  const progress = targetMinutes > 0 ? Math.min(remainingMinutes / targetMinutes, 1) : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>잠긴 앱</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              hitSlop={8}
              onPress={() => router.push('/(group)/notifications')}
            >
              <Icon name="bell" size={24} color={gray[800]} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              hitSlop={8}
              onPress={() => router.push('/(lock)/select-apps')}
            >
              <Icon name="plus" size={24} color={gray[800]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.ringSection}>
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={gray[100]}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={green[300]}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringValue}>{formatDuration(remainingMinutes)}</Text>
            </View>
          </View>
          <Text style={styles.ringLabel}>오늘 성과</Text>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <Pressable
          style={styles.summaryRow}
          onPress={() => router.push('/(lock)/goal-time')}
        >
          <Text style={styles.summaryText}>
            제한 시간 {targetMinutes}분 중{'\n'}
            {totalUsedMinutes}분 사용
          </Text>
          <View style={styles.changeButton}>
            <Text style={styles.changeButtonText}>변경</Text>
            <Icon name="caretRight" size={16} color={gray[400]} />
          </View>
        </Pressable>

        <Text style={styles.dateLabel}>{formatTodayLabel()}</Text>

        {lockedApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>아직 잠근 앱이 없어요.</Text>
            <Text style={styles.emptyStateSubtext}>
              오른쪽 위 + 버튼으로 잠글 앱을 추가해보세요.
            </Text>
          </View>
        ) : (
          lockedApps.map((app) => (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appIconPlaceholder}>
                <Text style={styles.appIconLetter}>{app.name.charAt(0)}</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appUnlockCount}>{app.unlockCount}회 해제</Text>
              </View>
              <Text style={styles.appUsedMinutes}>{app.usedMinutes}분 사용</Text>
              <Icon name="caretRight" size={16} color={gray[300]} />
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  safeArea: {
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.primary.title1B,
    color: gray[900],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSection: {
    alignItems: 'center',
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography.accent.h2,
    color: green[400],
  },
  ringLabel: {
    ...typography.primary.body2R,
    color: gray[500],
    marginTop: spacing[12],
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius[16],
    borderTopRightRadius: radius[16],
    paddingHorizontal: spacing[16],
    paddingTop: spacing[24],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  summaryText: {
    ...typography.primary.title2B,
    color: gray[900],
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[4],
  },
  changeButtonText: {
    ...typography.primary.body2R,
    color: gray[400],
  },
  dateLabel: {
    ...typography.primary.body2R,
    color: gray[400],
    marginTop: spacing[20],
    marginBottom: spacing[8],
  },
  emptyState: {
    paddingVertical: spacing[32],
    alignItems: 'center',
    gap: spacing[8],
  },
  emptyStateText: {
    ...typography.primary.body1M,
    color: gray[700],
  },
  emptyStateSubtext: {
    ...typography.primary.body2R,
    color: gray[400],
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
    borderTopWidth: 1,
    borderTopColor: gray[50],
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: radius[12],
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconLetter: {
    ...typography.primary.body1B,
    color: gray[400],
  },
  appInfo: {
    flex: 1,
    gap: spacing[2],
  },
  appName: {
    ...typography.primary.body1M,
    color: gray[900],
  },
  appUnlockCount: {
    ...typography.primary.body3R,
    color: gray[400],
  },
  appUsedMinutes: {
    ...typography.primary.body2R,
    color: gray[400],
  },
});
