import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray, brown, system, green } = primitiveColors;

const UNREGISTER_REASONS = [
  '목표(시험 등) 달성으로 제한할 필요가 없어요',
  '시간을 지키기 힘들어요.',
  '습관이 자리 잡았어요.',
  '기타',
];

const REASON_CONFIRM_DELAY_MS = 250;

type UnregisterStep = 'reason' | 'confirm' | null;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
};

export default function AppDetailScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { lockedApps, targetMinutes, unregisterApp } = useLockStore();
  const [unregisterStep, setUnregisterStep] = useState<UnregisterStep>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const app = lockedApps.find((candidate) => candidate.id === appId);

  useEffect(() => {
    if (selectedReason === null) return;

    const timer = setTimeout(() => setUnregisterStep('confirm'), REASON_CONFIRM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [selectedReason]);

  const handleUnregisterPress = () => {
    setSelectedReason(null);
    setUnregisterStep('reason');
  };

  const handleCancelUnregister = () => {
    setUnregisterStep(null);
    setSelectedReason(null);
  };

  const handleConfirmUnregister = () => {
    if (!app) return;
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
                <Text style={styles.cardValue}>n회</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>등록일</Text>
                <Text style={styles.cardValue}>{app.registeredAt}</Text>
              </View>
            </View>

            <Pressable
              hitSlop={8}
              style={styles.unregisterButton}
              onPress={handleUnregisterPress}
            >
              <Text style={styles.unregisterLabel}>등록 해제</Text>
            </Pressable>
          </>
        ) : null}
      </SafeAreaView>

      <Modal
        visible={unregisterStep === 'reason'}
        transparent
        animationType="slide"
        onRequestClose={handleCancelUnregister}
      >
        <Pressable style={styles.sheetOverlay} onPress={handleCancelUnregister}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>등록 해제 사유를 선택해주세요.</Text>
            <View style={styles.reasonList}>
              {UNREGISTER_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason && styles.reasonLabelSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={unregisterStep === 'confirm'}
        transparent
        animationType="fade"
        onRequestClose={handleCancelUnregister}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>등록 해제하시겠어요?</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: radius[16],
    borderWidth: 1,
    borderColor: gray[100],
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
  unregisterButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[16],
  },
  unregisterLabel: {
    ...typography.primary.body2R,
    color: system.blue.opacity100,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius[16],
    borderTopRightRadius: radius[16],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[32],
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: gray[100],
    marginTop: spacing[12],
    marginBottom: spacing[20],
  },
  sheetTitle: {
    ...typography.primary.title2B,
    color: gray[900],
    marginBottom: spacing[16],
  },
  reasonList: {
    gap: spacing[12],
  },
  reasonOption: {
    height: 56,
    borderRadius: radius[16],
    backgroundColor: green[75],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  reasonOptionSelected: {
    backgroundColor: green[300],
  },
  reasonLabel: {
    ...typography.primary.body1M,
    color: green[400],
    textAlign: 'center',
  },
  reasonLabelSelected: {
    color: '#FFFFFF',
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
