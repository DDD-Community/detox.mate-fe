import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from '@/screens/mypage/components/ProfileAvatar';

const { gray, green } = primitiveColors;
const SHEET_AVATAR_SIZE = 56;
const BACKDROP_COLOR = 'rgba(74, 74, 74, 0.48)';

interface FriendRemoveSheetProps {
  visible: boolean;
  displayName: string;
  profileImageUrl: string | null;
  removing: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function FriendRemoveSheet({
  visible,
  displayName,
  profileImageUrl,
  removing,
  error,
  onConfirm,
  onClose,
}: FriendRemoveSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!removing) onClose();
      }}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          disabled={removing}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="친구 삭제 취소"
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { marginBottom: Math.max(insets.bottom + 2, spacing[20]) }]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.content}>
            <ProfileAvatar uri={profileImageUrl} size={SHEET_AVATAR_SIZE} />
            <Text style={styles.description}>
              <Text style={styles.name}>{displayName}</Text>
              {' 님의 활동을 더 이상 볼 수 없게 되며,\n본인의 활동도 표시되지 않게 됩니다.'}
            </Text>
            {error ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <View style={styles.buttons}>
              <Pressable
                onPress={onConfirm}
                disabled={removing}
                accessibilityRole="button"
                accessibilityState={{ disabled: removing, busy: removing }}
                style={[styles.confirm, removing && styles.disabled]}
              >
                {removing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLabel}>친구 삭제</Text>
                )}
              </Pressable>
              <Pressable
                onPress={onClose}
                disabled={removing}
                accessibilityRole="button"
                accessibilityState={{ disabled: removing }}
                style={[styles.cancel, removing && styles.disabled]}
              >
                <Text style={styles.cancelLabel}>취소</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: BACKDROP_COLOR },
  sheet: {
    marginHorizontal: spacing[16],
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[20],
    borderRadius: spacing[24],
    backgroundColor: '#FFFFFF',
  },
  handleWrap: { height: spacing[16], alignItems: 'center', paddingTop: 5 },
  handle: { width: spacing[52], height: 5, borderRadius: radius.full, backgroundColor: gray[100] },
  content: { alignItems: 'center', paddingTop: spacing[24], gap: spacing[16] },
  description: { ...typography.primary.body2R, textAlign: 'center', color: gray[500] },
  name: { color: gray[900] },
  error: { ...typography.primary.body2R, textAlign: 'center', color: '#b42318' },
  buttons: { alignSelf: 'stretch', gap: spacing[4] },
  confirm: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: green[300],
  },
  confirmLabel: { ...typography.primary.body1B, color: '#FFFFFF' },
  cancel: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: gray[100],
  },
  cancelLabel: { ...typography.primary.body1B, color: gray[800] },
  disabled: { opacity: 0.5 },
});
