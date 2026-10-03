import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { UNREGISTER_REASONS } from './mockLockApps';

const { gray, green } = primitiveColors;

/**
 * 10초 재고 타이머 다음 단계. 사유를 골라 "확인"을 누르면 리포트 화면으로 돌아가
 * 최종 확인 모달을 띄운다.
 */
export default function UnregisterReasonScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { lockedApps } = useLockStore();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const app = lockedApps.find((candidate) => candidate.id === appId);

  const handleConfirm = () => {
    router.dismissTo({
      pathname: '/(lock)/app-detail',
      params: { appId, showUnregisterConfirm: '1' },
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color={gray[900]} />
          </Pressable>
          {app ? <Text style={styles.headerTitle}>{app.name}</Text> : null}
        </View>

        <Text style={styles.title}>왜 등록 해제하시나요?</Text>

        <View style={styles.reasonList}>
          {UNREGISTER_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <Pressable
                key={reason}
                style={styles.reasonRow}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Icon name="check" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.reasonLabel}>{reason}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="확인"
          variant="solid"
          color="primary"
          size="lg"
          disabled={selectedReason === null}
          onPress={handleConfirm}
          style={styles.confirmButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTitle: {
    ...typography.primary.body1M,
    color: gray[900],
  },
  title: {
    ...typography.primary.title2B,
    color: gray[800],
    marginTop: spacing[24],
    marginBottom: spacing[20],
  },
  reasonList: {
    flex: 1,
    gap: spacing[20],
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius[8],
    borderWidth: 1,
    borderColor: gray[100],
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: green[400],
    backgroundColor: green[400],
  },
  reasonLabel: {
    ...typography.primary.body1R,
    color: gray[800],
  },
  confirmButton: {
    width: '100%',
    marginBottom: spacing[16],
  },
});
