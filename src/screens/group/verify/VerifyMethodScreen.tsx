import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '@/components';
import { primitiveColors, typography } from '@/lib/token';
import { useVerifyMethodNavigation } from './useVerifyMethodNavigation';
import { VerifyBottomSheet } from './VerifyBottomSheet';
import type { VerifyMode } from './verifyFlowParams';

const { gray } = primitiveColors;

export default function VerifyMethodScreen() {
  const { mode, goal, groupChallengeParticipantId } = useLocalSearchParams<{
    mode?: VerifyMode;
    goal?: string;
    groupChallengeParticipantId?: string;
  }>();
  const { handleGallery, handleSettings } = useVerifyMethodNavigation({
    mode,
    goal,
    groupChallengeParticipantId,
  });

  return (
    <VerifyBottomSheet onDismiss={() => router.back()}>
      <View style={styles.content}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>
            {mode === 'verify' ? '어제의 스크린 타임\n인증하기' : '내 스크린 타임\n인증하기'}
          </Text>
          <Text style={styles.description}>둘 중 하나를 선택해주세요.</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="갤러리로 가기"
            color="assistive"
            onPress={handleGallery}
            style={styles.button}
            leadingIcon={<Icon name="imageSquare" size={16} color="#FFFFFF" />}
          />
          <Button
            label="설정으로 캡쳐하러 가기"
            color="assistive"
            onPress={handleSettings}
            style={styles.button}
            leadingIcon={<Icon name="gearSix" size={16} color="#FFFFFF" />}
          />
        </View>
      </View>
    </VerifyBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  textGroup: {
    gap: 12,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  description: {
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
  },
  actions: {
    gap: 12,
  },
  button: {
    alignSelf: 'stretch',
  },
});
