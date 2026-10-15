import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, primitiveColors } from '@/lib/token';
import { OnboardingContinueButton } from './OnboardingContinueButton';
import { OnboardingLayout } from './OnboardingLayout';

type Props = {
  pending: boolean;
  onAllow: () => void;
  onSkip: () => void;
};

export function NotificationDeniedGuide({ pending, onAllow, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <OnboardingLayout
      footer={
        <>
          <OnboardingContinueButton
            label="알림 권한 허용"
            disabled={pending}
            onPress={onAllow}
            labelStyle={styles.allowText}
          />
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={onSkip}
            style={({ pressed }) => [styles.skip, (pressed || pending) && styles.dimmed]}
          >
            <Text style={styles.skipText}>나중에 하기</Text>
          </Pressable>
        </>
      }
    >
      <View style={[styles.body, { paddingTop: Math.max(230 - insets.top, 24) }]}>
        <Text style={styles.title}>
          디톡스메이트 사용에{'\n'}도움이 되는 권한이 해제되어 있어요
        </Text>
        <Text style={styles.description}>
          앱 잠금 일시 해제 시{' '}
          <Text style={styles.highlight}>알림을 통해 디톡스메이트로 이동해 해제 시간을 설정</Text>할
          수 있어요.
        </Text>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            휴대폰 설정 메뉴 &gt; 디톡스메이트 앱 &gt;{'\n'}디톡스메이트 접근 허용에서{'\n'}권한
            설정을 변경할 수 있습니다.
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 22,
    lineHeight: 30,
    color: primitiveColors.gray[900],
    textAlign: 'center',
  },
  description: {
    maxWidth: 310,
    marginTop: 12,
    fontFamily: fontFamily.primary.medium,
    fontSize: 16,
    lineHeight: 26,
    color: primitiveColors.gray[800],
    textAlign: 'center',
  },
  highlight: { color: primitiveColors.green[300] },
  bubble: {
    marginTop: 24,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: primitiveColors.green[50],
  },
  bubbleText: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: primitiveColors.green[300],
  },
  skip: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  allowText: {
    fontFamily: fontFamily.primary.semibold,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  skipText: {
    fontFamily: fontFamily.primary.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: primitiveColors.gray[400],
  },
  dimmed: { opacity: 0.6 },
});
