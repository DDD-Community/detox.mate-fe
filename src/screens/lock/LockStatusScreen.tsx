import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DetoxmateWordmark } from '../../components/DetoxmateWordmark';
import { Icon } from '../../components/Icon';
import { LoggingButton } from '../../components/LoggingButton';
import { fontFamily, primitiveColors, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { ScreenTimeReportView } from '../../../modules/screen-time-report';

const { gray, green } = primitiveColors;

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
          <DetoxmateWordmark />
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
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.summaryRow}
          onPress={() => router.push({ pathname: '/(lock)/goal-time', params: { mode: 'change' } })}
        >
          <Text style={styles.summaryText}>
            제한 시간 <Text style={styles.summaryTextStrong}>{targetMinutes}분</Text> 중
          </Text>
          <View style={styles.changeButton}>
            <Text style={styles.changeButtonText}>변경</Text>
            <Icon name="caretRight" size={16} color={gray[400]} />
          </View>
        </Pressable>

        {allSelectionTokens.length > 0 ? (
          <ScreenTimeReportView
            selectionTokens={allSelectionTokens}
            reportStyle="summary"
            style={styles.usageSummaryView}
          />
        ) : null}

        <Text style={styles.dateLabel}>{formatTodayLabel()}</Text>

        {lockedApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>아직 잠근 앱이 없어요.</Text>
            <Text style={styles.emptyStateSubtext}>
              오른쪽 위 + 버튼으로 잠글 앱을 추가해보세요.
            </Text>
          </View>
        ) : (
          lockedApps.map((app, index) => {
            const token = familyActivitySelectionsByAppId[app.id];
            return (
              <View key={app.id}>
                {index > 0 ? <View style={styles.rowSeparator} /> : null}
                <Pressable
                  style={styles.appRow}
                  onPress={() =>
                    router.push({ pathname: '/(lock)/app-detail', params: { appId: app.id } })
                  }
                >
                  {token ? (
                    <ScreenTimeReportView
                      selectionTokens={[token]}
                      reportStyle="appRow"
                      style={styles.appRowView}
                    />
                  ) : null}
                  {/* 앱 이름 아래 자리는 네이티브 행(AppRowView)이 비워둔다 — 그 위에 얹는다. */}
                  <Text style={styles.appUnlockCount} pointerEvents="none">
                    {app.unlockCount}회 해제
                  </Text>
                </Pressable>
              </View>
            );
          })
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

        {/* [임시] 리포트 UI 커스텀 범위 확인용 — 확인 후 삭제 */}
        <Pressable
          style={styles.tempShowcaseButton}
          onPress={() => router.push('/(lock)/ui-showcase')}
        >
          <Text style={styles.tempShowcaseButtonText}>[임시] UI 커스텀 샘플 보기</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const ROW_ICON_SIZE = 44;
const ROW_HEIGHT = 68;
const ROW_TEXT_LEFT = spacing[16] + ROW_ICON_SIZE + spacing[8];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
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
  content: {
    paddingTop: spacing[16],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
  },
  summaryText: {
    fontFamily: fontFamily.primary.light,
    fontSize: 18,
    lineHeight: 26,
    color: '#000000',
  },
  summaryTextStrong: {
    ...typography.primary.title2M,
    lineHeight: 26,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[4],
  },
  changeButtonText: {
    ...typography.primary.body2R,
    color: 'rgba(60, 60, 67, 0.6)',
  },
  usageSummaryView: {
    height: 34,
    marginTop: spacing[4],
    marginHorizontal: spacing[16],
  },
  dateLabel: {
    ...typography.primary.body3B,
    color: gray[800],
    opacity: 0.8,
    marginTop: spacing[24],
    marginBottom: spacing[8],
    paddingHorizontal: spacing[16],
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
    height: ROW_HEIGHT,
  },
  appRowView: {
    height: ROW_HEIGHT,
  },
  // 행 사이 구분선은 아이콘 오른쪽부터 시작한다(피그마 Row separator).
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: ROW_TEXT_LEFT,
    marginRight: spacing[16],
    backgroundColor: '#E6E6E6',
  },
  // AppRowView: 이름(22) + 이 자리(20)가 68 높이 안에서 세로 가운데 → 이름 끝이 y=35.
  appUnlockCount: {
    ...typography.primary.body2R,
    lineHeight: 20,
    color: 'rgba(60, 60, 67, 0.6)',
    position: 'absolute',
    left: ROW_TEXT_LEFT,
    top: 35,
  },
  tempShowcaseButton: {
    alignSelf: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    marginBottom: spacing[24],
  },
  tempShowcaseButtonText: {
    ...typography.primary.body3R,
    color: gray[400],
    textDecorationLine: 'underline',
  },
  addAppChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing[4],
    height: 40,
    paddingHorizontal: spacing[16],
    borderRadius: 999,
    backgroundColor: green[300],
    marginTop: spacing[32],
    marginBottom: spacing[16],
  },
  addAppChipText: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
  },
});
