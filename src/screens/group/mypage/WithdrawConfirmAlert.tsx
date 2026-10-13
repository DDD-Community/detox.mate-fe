import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, LoggingButton } from '@/components';
import { fontFamily, primitiveColors, radius, spacing, typography } from '@/lib/token';

const { gray, system } = primitiveColors;
const RED = system.red.opacity100;
const RED_10 = system.red.opacity10;

interface WithdrawConfirmAlertProps {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function WithdrawConfirmAlert({
  visible,
  onClose,
  onDismiss,
  onConfirm,
  loading,
}: WithdrawConfirmAlertProps) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable accessible={false} style={styles.backdrop} onPress={loading ? undefined : onClose}>
        <Pressable
          accessible={false}
          onPress={(event) => event.stopPropagation()}
          style={styles.card}
        >
          <View style={styles.topSection}>
            <Text style={styles.title}>정말 탈퇴하시겠어요?</Text>
            <View style={styles.descBlock}>
              <Text style={styles.descText}>
                탈퇴하면 이 계정으로 더 이상{'\n'}서비스를 이용할 수 없어요.
              </Text>
              <View style={styles.warningChip}>
                <Icon name="info" size={16} color={RED} />
                <Text style={styles.warningText}>탈퇴 전 한 번 더 확인해 주세요</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <LoggingButton
              eventName="Withdraw Confirm Alert Cancel Clicked"
              properties={{ pageName: 'WithdrawConfirmAlert', buttonName: '취소' }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && !loading && styles.cancelPressed,
                ]}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
            </LoggingButton>
            <LoggingButton
              eventName="Withdraw Confirm Alert Withdraw Confirm Clicked"
              properties={{ pageName: 'WithdrawConfirmAlert', buttonName: '탈퇴하기' }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                disabled={loading}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && !loading && styles.confirmPressed,
                  loading && styles.disabled,
                ]}
              >
                <Text style={styles.confirmText}>탈퇴하기</Text>
              </Pressable>
            </LoggingButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  card: {
    width: '100%',
    maxWidth: 343,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[32],
    gap: spacing[40],
  },
  topSection: {
    width: '100%',
    gap: spacing[20],
  },
  title: {
    fontFamily: fontFamily.primary.extraBold,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
    color: '#0A0A0A',
    textAlign: 'center',
  },
  descBlock: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[8],
  },
  descText: {
    ...typography.primary.body2R,
    color: '#4A5565',
    textAlign: 'center',
  },
  warningChip: {
    height: 44,
    paddingHorizontal: spacing[12],
    borderRadius: radius[4],
    backgroundColor: RED_10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  warningText: {
    ...typography.primary.body2B,
    color: RED,
  },
  actions: {
    width: '100%',
    gap: spacing[8],
  },
  cancelButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    opacity: 0.85,
  },
  cancelText: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
  },
  confirmButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPressed: {
    backgroundColor: gray[100],
  },
  confirmText: {
    ...typography.primary.body2B,
    color: gray[800],
  },
  disabled: {
    opacity: 0.5,
  },
});
