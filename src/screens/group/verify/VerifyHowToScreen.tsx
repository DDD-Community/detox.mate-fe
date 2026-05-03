import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray } = primitiveColors;

export default function VerifyHowToScreen() {
  const handleConfirm = () => {
    router.replace('/(group)/verify/method');
  };

  return (
    <Pressable style={styles.overlay} onPress={() => router.back()}>
      <Pressable style={styles.card} onPress={() => {}}>
        <View style={styles.content}>
          <View style={styles.textGroup}>
            <Text style={styles.title}>이렇게 찍어주세요</Text>
            <Text style={styles.description}>
              설정 - 스크린타임에서{'\n'}어제의 총 스크린타임이 보이도록 캡쳐해주세요
            </Text>
          </View>

          <Image
            source={require('../../../../assets/screen_time_ref.png')}
            style={styles.imagePlaceholder}
            resizeMode="contain"
          />
        </View>

        <Button label="확인" color="assistive" onPress={handleConfirm} style={styles.button} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    maxWidth: 359,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 40,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  textGroup: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...typography.accent.h3,
    color: '#0A0A0A',
    textAlign: 'center',
    letterSpacing: -0.52,
  },
  description: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  imagePlaceholder: {
    width: 141,
    height: 305,
  },
  button: {
    alignSelf: 'stretch',
  },
});
