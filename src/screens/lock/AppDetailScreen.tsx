import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { ScreenTimeReportView } from '../../../modules/screen-time-report';

const { gray, brown, system, green } = primitiveColors;

type UnregisterStep = 'confirm' | null;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
};

export default function AppDetailScreen() {
  const router = useRouter();
  const { appId, showUnregisterConfirm } = useLocalSearchParams<{
    appId: string;
    showUnregisterConfirm?: string;
  }>();
  const { lockedApps, targetMinutes, unregisterApp, familyActivitySelectionsByAppId } =
    useLockStore();
  const [unregisterStep, setUnregisterStep] = useState<UnregisterStep>(null);

  const app = lockedApps.find((candidate) => candidate.id === appId);
  const realSelectionToken = app ? familyActivitySelectionsByAppId[app.id] : undefined;

  // 10초 재고 타이머 → 사유 선택 화면(각각 별도 라우트)을 거쳐 돌아오면
  // 마지막 확인 모달을 이어서 띄운다.
  useEffect(() => {
    if (showUnregisterConfirm === '1') setUnregisterStep('confirm');
  }, [showUnregisterConfirm]);

  const handleUnregisterPress = () => {
    router.push({ pathname: '/(lock)/unregister-timer', params: { appId } });
  };

  const handleCancelUnregister = () => {
    setUnregisterStep(null);
  };

  const handleConfirmUnregister = () => {
    if (!app) return;

    // 이 앱만 골라서 받아둔 토큰이 있으면 그 앱만 진짜로 해제한다. mock 시드 앱(토큰 없음)은
    // 애초에 실제로 잠긴 적이 없어서 건너뛴다.
    const token = familyActivitySelectionsByAppId[app.id];
    if (token) {
      ReactNativeDeviceActivity.unblockSelection(
        { activitySelectionToken: token },
        'app-unregistered'
      );
    }

    unregisterApp(app.id);
    setUnregisterStep(null);
    router.back();
  };

  const percentage =
    app && targetMinutes > 0
      ? Math.min(Math.round((app.usedMinutes / targetMinutes) * 100), 100)
      : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color={gray[900]} />
          </Pressable>
          {app ? (
            <>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconLetter}>{app.name.charAt(0)}</Text>
              </View>
              <Text style={styles.headerTitle}>{app.name}</Text>
            </>
          ) : null}
        </View>

        {app ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroIconLetter}>{app.name.charAt(0)}</Text>
              </View>
              <Text style={styles.heroName}>{app.name}</Text>
              <Text style={styles.heroUsed}>{formatDuration(app.usedMinutes)}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>제한 시간 중</Text>
                <Text style={styles.cardValue}>{percentage}%</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>잠금 해제</Text>
                <Text style={styles.cardValue}>{app.unlockCount}회</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>등록일</Text>
                <Text style={styles.cardValue}>{app.registeredAt}</Text>
              </View>
            </View>

            {realSelectionToken ? (
              <View style={styles.realReportSection}>
                <Text style={styles.realReportLabel}>실제 스크린타임</Text>
                <ScreenTimeReportView
                  selectionTokens={[realSelectionToken]}
                  style={styles.realReportView}
                />
              </View>
            ) : null}

            <Pressable hitSlop={8} style={styles.unregisterButton} onPress={handleUnregisterPress}>
              <Text style={styles.unregisterLabel}>등록 해제</Text>
            </Pressable>
          </>
        ) : null}
      </SafeAreaView>

      <Modal
        visible={unregisterStep === 'confirm'}
        transparent
        animationType="fade"
        onRequestClose={handleCancelUnregister}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>정말 등록 해제하시겠어요?</Text>
            <Text style={styles.confirmSubtitle}>
              해제 시 저장된 기록이 모두 삭제되며,{'\n'}복구는 불가합니다.
            </Text>
            <Pressable style={styles.confirmCancelButton} onPress={handleCancelUnregister}>
              <Text style={styles.confirmCancelLabel}>취소</Text>
            </Pressable>
            <Pressable style={styles.confirmDestructiveButton} onPress={handleConfirmUnregister}>
              <Text style={styles.confirmDestructiveLabel}>해제하기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing[16],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    height: 54,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: radius[8],
    backgroundColor: gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconLetter: {
    ...typography.primary.body3B,
    color: gray[500],
  },
  headerTitle: {
    ...typography.primary.body1M,
    color: gray[900],
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing[48],
    paddingBottom: spacing[32],
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: radius[16],
    backgroundColor: gray[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconLetter: {
    ...typography.accent.h2,
    color: '#FFFFFF',
  },
  heroName: {
    ...typography.primary.body1M,
    color: gray[500],
    marginTop: spacing[16],
  },
  heroUsed: {
    ...typography.accent.h3,
    color: gray[900],
    marginTop: spacing[8],
  },
  card: {
    backgroundColor: green[50],
    borderRadius: radius[16],
    paddingHorizontal: spacing[16],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  cardLabel: {
    ...typography.primary.body1R,
    color: gray[700],
  },
  cardValue: {
    ...typography.primary.body1M,
    color: gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: gray[50],
  },
  realReportSection: {
    marginTop: spacing[16],
  },
  realReportLabel: {
    ...typography.primary.body3R,
    color: gray[400],
    marginBottom: spacing[8],
  },
  realReportView: {
    height: 240,
  },
  unregisterButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[16],
  },
  unregisterLabel: {
    ...typography.primary.caption,
    color: gray[400],
    textDecorationLine: 'underline',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius[16],
    padding: spacing[24],
    alignItems: 'center',
    gap: spacing[8],
  },
  confirmTitle: {
    ...typography.primary.title2B,
    color: gray[900],
    textAlign: 'center',
  },
  confirmSubtitle: {
    ...typography.primary.body2R,
    color: gray[500],
    textAlign: 'center',
    marginBottom: spacing[16],
  },
  confirmCancelButton: {
    width: '100%',
    height: 52,
    borderRadius: radius[16],
    backgroundColor: system.red.opacity100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
  confirmDestructiveButton: {
    width: '100%',
    height: 52,
    borderRadius: radius[16],
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  confirmDestructiveLabel: {
    ...typography.primary.body1M,
    color: gray[500],
  },
});
