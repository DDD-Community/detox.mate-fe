import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenTimeReportView } from '../../../modules/screen-time-report';
import { Icon } from '../../components/Icon';
import { releaseAppLock } from '../../lib/lockRegistration';
import { getSevenDayAverageMinutes } from '../../lib/screenTimeHistory';
import { syncTargetMinutes } from '../../lib/sharedDisplayConfig';
import { unregisterAppShield } from '../../lib/shieldConfig';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

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
  const [sevenDayAverageMinutes, setSevenDayAverageMinutes] = useState<number | null>(null);

  const app = lockedApps.find((candidate) => candidate.id === appId);
  const realSelectionToken = app ? familyActivitySelectionsByAppId[app.id] : undefined;

  // 최근 7일 평균(10분 단위 근사치). 아직 데이터가 안 쌓였으면 null — 가짜 숫자를 보여주지 않는다.
  useEffect(() => {
    if (!appId) return;
    getSevenDayAverageMinutes(appId).then(setSevenDayAverageMinutes);
  }, [appId]);

  // 오늘 사용 비율(%)은 사용 시간을 아는 리포트 익스텐션이 계산해 그린다 — 제한 시간만 넘겨준다.
  useEffect(() => {
    syncTargetMinutes(targetMinutes);
  }, [targetMinutes]);

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
      releaseAppLock(app.id, token);
    } else {
      unregisterAppShield(app.id);
    }
    unregisterApp(app.id);
    setUnregisterStep(null);
    router.back();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color={gray[900]} />
          </Pressable>
          {app && realSelectionToken ? (
            <ScreenTimeReportView
              selectionTokens={[realSelectionToken]}
              reportStyle="headerLabel"
              style={styles.headerLabelView}
            />
          ) : null}
        </View>

        {app ? (
          <>
            {realSelectionToken ? (
              <ScreenTimeReportView
                selectionTokens={[realSelectionToken]}
                reportStyle="hero"
                style={styles.heroReportView}
              />
            ) : null}

            <View style={styles.card}>
              {realSelectionToken ? (
                <>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>오늘 제한 시간 중</Text>
                    <ScreenTimeReportView
                      selectionTokens={[realSelectionToken]}
                      reportStyle="percent"
                      style={styles.percentReportView}
                    />
                  </View>
                  <View style={styles.divider} />
                </>
              ) : null}
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>오늘 잠금 해제</Text>
                <Text style={styles.cardValue}>{app.unlockCount}회</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>등록일</Text>
                <Text style={styles.cardValue}>{app.registeredAt}</Text>
              </View>
              {sevenDayAverageMinutes !== null ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>최근 7일 평균</Text>
                    <Text style={styles.cardValue}>{formatDuration(sevenDayAverageMinutes)}</Text>
                  </View>
                </>
              ) : null}
            </View>

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
  headerLabelView: {
    flex: 1,
    height: 32,
  },
  // 피그마: 아이콘 83 + 12 + 이름 26 + 4 + 사용 시간 32 = 157.
  heroReportView: {
    height: 157,
    marginTop: spacing[48],
    marginBottom: spacing[32],
  },
  card: {
    backgroundColor: green[50],
    borderRadius: 26,
    paddingHorizontal: spacing[16],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  percentReportView: {
    width: 96,
    height: 52,
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E6',
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
