import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLogo } from '../../components/AppLogo';
import { Icon } from '../../components/Icon';
import { LoggingButton } from '../../components/LoggingButton';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { ScreenTimeReportView } from '../../../modules/screen-time-report';

const { gray, green, brown } = primitiveColors;

const formatTodayLabel = () => {
  const now = new Date();
  return `오늘, ${now.getMonth() + 1}월 ${now.getDate()}일`;
};

export default function LockStatusScreen() {
  const router = useRouter();
  const { targetMinutes, lockedApps, familyActivitySelectionsByAppId } = useLockStore();

  const allSelectionTokens = Object.values(familyActivitySelectionsByAppId);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <AppLogo />
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

        {allSelectionTokens.length > 0 ? (
          <View style={styles.reportSection}>
            <ScreenTimeReportView
              selectionTokens={allSelectionTokens}
              style={styles.reportView}
            />
          </View>
        ) : null}
      </SafeAreaView>

      <View style={styles.sheet}>
        <Pressable style={styles.summaryRow} onPress={() => router.push('/(lock)/goal-time')}>
          <Text style={styles.summaryText}>제한 시간 {targetMinutes}분</Text>
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
            <Pressable
              key={app.id}
              style={styles.appRow}
              onPress={() =>
                router.push({ pathname: '/(lock)/app-detail', params: { appId: app.id } })
              }
            >
              <View style={styles.appIconPlaceholder}>
                <Text style={styles.appIconLetter}>{app.name.charAt(0)}</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appUnlockCount}>{app.unlockCount}회 해제</Text>
              </View>
              <Icon name="caretRight" size={16} color={gray[300]} />
            </Pressable>
          ))
        )}

        <LoggingButton
          eventName="Lock Status Add App Clicked"
          properties={{ pageName: 'LockStatus', buttonName: '앱 추가하기' }}
        >
          <Pressable style={styles.addAppChip} onPress={() => router.push('/(lock)/select-apps')}>
            <Icon name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.addAppChipText}>앱 추가하기</Text>
          </Pressable>
        </LoggingButton>
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
  reportSection: {
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
    paddingHorizontal: spacing[16],
  },
  reportView: {
    height: 220,
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
  addAppChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing[4],
    height: 40,
    paddingHorizontal: spacing[16],
    borderRadius: radius.full,
    backgroundColor: green[300],
    marginTop: spacing[20],
    marginBottom: spacing[16],
  },
  addAppChipText: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
  },
});
