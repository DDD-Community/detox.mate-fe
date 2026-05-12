import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, spacing, typography } from '../../../lib/token';

const { gray, system } = primitiveColors;
const RED = system.red.opacity100;
const RED_10 = system.red.opacity10;

const ICONS = {
  signOut: require('../../../../assets/icons/regular/icon_rg_SignOut.png'),
  info: require('../../../../assets/icons/regular/icon_rg_Info.png'),
} as const;

interface LeaveGroupAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function LeaveGroupAlert({ visible, onClose, onConfirm, loading }: LeaveGroupAlertProps) {
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
          <View style={styles.topSection}>
            <View style={styles.iconCircle}>
              <Image source={ICONS.signOut} style={styles.signOutIcon} resizeMode="contain" />
            </View>
            <Text style={styles.title}>그룹을 나가시나요?</Text>
            <View style={styles.descBlock}>
              <Text style={styles.descText}>지금까지의 인증 기록과{'\n'}대화 내용이 모두 사라져요.</Text>
              <View style={styles.warningChip}>
                <Image source={ICONS.info} style={styles.warningIcon} resizeMode="contain" />
                <Text style={styles.warningText}>삭제된 그룹은 복구될 수 없어요</Text>
                <Image source={ICONS.info} style={styles.warningIcon} resizeMode="contain" />
              </View>
            </View>
          </View>

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
              <Text style={styles.confirmText}>동의하고 나가기</Text>
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
    alignItems: 'center',
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[20],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: RED_10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIcon: {
    width: 32,
    height: 32,
    tintColor: RED,
  },
  title: {
    fontFamily: typography.primary.title1B.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
    color: gray[800],
    textAlign: 'center',
  },
  descBlock: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[8],
  },
  descText: {
    ...typography.primary.body2R,
    color: gray[500],
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
  warningIcon: {
    width: 16,
    height: 16,
    tintColor: RED,
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
