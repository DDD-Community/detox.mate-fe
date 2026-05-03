import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { brown, green } = primitiveColors;

export default function VerifyWrongTimeScreen() {
  const { achieved } = useLocalSearchParams<{ achieved?: string }>();
  const goalAchieved = achieved !== '0';

  const handleClose = () => {
    router.back();
  };

  const handleConfirm = () => {
    if (goalAchieved) {
      router.replace('/(group)/post');
    } else {
      router.replace('/(group)/verify/retro');
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.alert}>
        <Text style={styles.title}>접수 되었습니다</Text>
        <Text style={styles.body}>{'사진을 검토한 뒤\n수일 내로 반영해 드릴게요'}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeLabel}>닫기</Text>
          </Pressable>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmLabel}>확인</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alert: {
    width: '100%',
    maxWidth: 326,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
  },
  title: {
    ...typography.primary.title1B,
    color: '#0A0A0A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  body: {
    ...typography.primary.body2R,
    color: '#4A5565',
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  closeButton: {
    height: 50,
    width: 108,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: brown[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
  confirmButton: {
    height: 50,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: 0,
    flexGrow: 1,
  },
  confirmLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
});
