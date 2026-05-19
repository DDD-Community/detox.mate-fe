import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, spacing, typography } from '../../../lib/token';

const { gray, green } = primitiveColors;

interface LogoutConfirmAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function LogoutConfirmAlert({
  visible,
  onClose,
  onConfirm,
  loading,
}: LogoutConfirmAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Text style={styles.title}>로그아웃 하시겠어요?</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !loading && styles.cancelPressed,
              ]}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && !loading && styles.confirmPressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.confirmText}>로그아웃</Text>
            </Pressable>
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
  title: {
    fontFamily: typography.primary.title1B.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
    color: '#0A0A0A',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing[8],
  },
  cancelButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: green[300],
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
