import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoggingButton } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

const { gray } = primitiveColors;
const SHEET_SIDE_MARGIN = 8;
const SHEET_BOTTOM_GAP = 8;

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
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[styles.sheet, { bottom: insets.bottom + SHEET_BOTTOM_GAP }]}
        >
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>
          <View style={styles.list}>
            <LoggingButton
              eventName="Profile Image Bottom Sheet Profile Image Default Select Clicked"
              properties={{ pageName: 'ProfileImageBottomSheet', buttonName: '기본 이미지' }}
            >
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
            </LoggingButton>
            <LoggingButton
              eventName="Profile Image Bottom Sheet Profile Image Gallery Select Clicked"
              properties={{ pageName: 'ProfileImageBottomSheet', buttonName: '갤러리에서 선택' }}
            >
              <Pressable
                onPress={onSelectGallery}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Text style={styles.rowText}>갤러리에서 선택</Text>
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
  },
  sheet: {
    position: 'absolute',
    left: SHEET_SIDE_MARGIN,
    right: SHEET_SIDE_MARGIN,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
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
