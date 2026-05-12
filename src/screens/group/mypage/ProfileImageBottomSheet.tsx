import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { primitiveColors, radius, spacing, typography } from '../../../lib/token';

const { gray } = primitiveColors;

interface ProfileImageBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectDefault: () => void;
  onSelectGallery: () => void;
}

export function ProfileImageBottomSheet({
  visible,
  onClose,
  onSelectDefault,
  onSelectGallery,
}: ProfileImageBottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheetWrap}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.grabberWrap}>
              <View style={styles.grabber} />
            </View>
            <View style={styles.list}>
              <Pressable
                onPress={onSelectDefault}
                style={({ pressed }) => [
                  styles.row,
                  styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.rowText}>기본 이미지</Text>
              </Pressable>
              <Pressable
                onPress={onSelectGallery}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Text style={styles.rowText}>갤러리에서 선택</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    paddingHorizontal: spacing[8],
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing[28],
    paddingBottom: spacing[16],
  },
  grabberWrap: {
    paddingTop: 5,
    paddingBottom: spacing[4],
    alignItems: 'center',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: gray[200],
  },
  list: {
    paddingTop: spacing[4],
  },
  row: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: gray[50],
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    ...typography.primary.body1R,
    color: gray[800],
  },
});
