import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, spacing, typography } from '@/lib/token';

const { gray, green } = primitiveColors;
const DIM_COLOR = 'rgba(43, 47, 56, 0.5)';
const OPTION_RADIUS = 18;

interface ProfilePhotoDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectDefault: () => void;
}

export function ProfilePhotoDialog({
  visible,
  onClose,
  onSelectGallery,
  onSelectDefault,
}: ProfilePhotoDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dim}>
        <View style={styles.popup}>
          <View style={styles.texts}>
            <Text style={styles.title}>프로필 사진 변경</Text>
            <Text style={styles.description}>
              {'프로필 사진은 친구들에게 보여지고,\n친구들이 나를 더 쉽게 찾을 수 있게 해줘요.'}
            </Text>
          </View>
          <View style={styles.buttons}>
            <Pressable onPress={onSelectGallery} style={styles.option} accessibilityRole="button">
              <Text style={styles.optionText}>갤러리</Text>
            </Pressable>
            <Pressable onPress={onSelectDefault} style={styles.option} accessibilityRole="button">
              <Text style={styles.optionText}>기본 이미지로 변경</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    flex: 1,
    backgroundColor: DIM_COLOR,
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: spacing[24],
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[32],
    gap: spacing[40],
  },
  texts: { gap: spacing[20] },
  title: { ...typography.primary.title1M, textAlign: 'center', color: gray[900] },
  description: { ...typography.primary.body2R, textAlign: 'center', color: gray[500] },
  buttons: { gap: spacing[8] },
  option: {
    height: spacing[44],
    borderRadius: OPTION_RADIUS,
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { ...typography.primary.body2B, color: gray[800] },
  cancel: {
    height: spacing[44],
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.primary.body2B, color: '#FFFFFF' },
});
