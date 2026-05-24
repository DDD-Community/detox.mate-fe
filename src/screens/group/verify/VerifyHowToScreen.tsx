import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import SCREEN_TIME_REF_IMAGE from '@assets/screen_time_ref.png';

import { Button } from '@/components';
import { primitiveColors, typography } from '@/lib/token';
import { useVerifyHowToGate } from './useVerifyHowToGate';
import type { VerifyMode } from './verifyFlowParams';

const { gray } = primitiveColors;

export default function VerifyHowToScreen() {
  const { mode, goal, groupChallengeParticipantId } = useLocalSearchParams<{
    mode?: VerifyMode;
    goal?: string;
    groupChallengeParticipantId?: string;
  }>();
  const { handleConfirm, handleHideForever, isVerifyMode, ready } = useVerifyHowToGate({
    mode,
    goal,
    groupChallengeParticipantId,
  });

  if (!ready) {
    return <View style={styles.overlay} />;
  }

  return (
    <Pressable style={styles.overlay} onPress={() => router.back()}>
      <Pressable style={styles.card} onPress={() => {}}>
        <View style={styles.content}>
          <View style={styles.textGroup}>
            <Text style={styles.title}>이렇게 찍어주세요</Text>
            <Text style={styles.description}>
              설정 - 스크린 타임에서{'\n'}어제의 총 스크린 타임이 보이도록 캡쳐해주세요
            </Text>
          </View>

          <Image
            source={SCREEN_TIME_REF_IMAGE}
            style={styles.imagePlaceholder}
            resizeMode="contain"
          />
        </View>

        {isVerifyMode ? (
          <Pressable style={styles.hideButton} onPress={handleHideForever}>
            <Text style={styles.hideButtonLabel}>다시 보지 않기</Text>
          </Pressable>
        ) : (
          <Button label="확인" color="assistive" onPress={handleConfirm} style={styles.button} />
        )}
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
    paddingTop: 32,
    paddingBottom: 20,
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
  hideButton: {
    height: 44,
    minWidth: 80,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  hideButtonLabel: {
    ...typography.primary.body1B,
    color: gray[800],
    textAlign: 'center',
    letterSpacing: -0.32,
  },
});
