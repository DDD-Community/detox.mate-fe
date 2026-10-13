import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LoggingButton } from '@/components';
import { fontFamily, primitiveColors, spacing, typography } from '@/lib/token';

const { gray, green } = primitiveColors;

interface NotificationPermissionAlertProps {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onConfirm: () => void;
}

export function NotificationPermissionAlert({
  visible,
  onClose,
  onDismiss,
  onConfirm,
}: NotificationPermissionAlertProps) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable accessible={false} style={styles.backdrop} onPress={onClose}>
        <Pressable
          accessible={false}
          onPress={(event) => event.stopPropagation()}
          style={styles.card}
        >
          <View style={styles.topSection}>
            <Text style={styles.title}>알림 권한 허용이 필요해요</Text>
            <Text style={styles.description}>
              알림을 받으려면 기기 설정에서 알림을 허용해 주세요.
            </Text>
          </View>

          <View style={styles.actions}>
            <LoggingButton
              eventName="Notification Permission Alert App Settings Open Clicked"
              properties={{ pageName: 'NotificationPermissionAlert', buttonName: '설정으로 가기' }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
              >
                <Text style={styles.primaryText}>설정으로 가기</Text>
              </Pressable>
            </LoggingButton>
            <LoggingButton
              eventName="Notification Permission Alert Cancel Clicked"
              properties={{ pageName: 'NotificationPermissionAlert', buttonName: '취소' }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryPressed,
                ]}
              >
                <Text style={styles.secondaryText}>취소</Text>
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
  description: {
    ...typography.primary.body2R,
    color: '#4A5565',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing[8],
  },
  primaryButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    opacity: 0.85,
  },
  primaryText: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    backgroundColor: gray[100],
  },
  secondaryText: {
    ...typography.primary.body2B,
    color: gray[800],
  },
});
