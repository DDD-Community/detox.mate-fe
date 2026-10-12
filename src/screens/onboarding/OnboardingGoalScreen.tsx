import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoggingPage } from '@/components';
import { fontFamily, primitiveColors, spacing } from '@/lib/token';
import { GoalTimeCard } from '../lock/GoalTimeCard';
import { useSaveGoalTime } from '../lock/useSaveGoalTime';
import { OnboardingLayout } from './OnboardingLayout';
import { OnboardingContinueButton } from './OnboardingContinueButton';

const INITIAL_GOAL_HOURS = 0;
const MINUTES_PER_HOUR = 60;

// Figma 목표 시간 시안 A의 배치 기준. 작은 화면에서는 상단 여백부터 줄인다.
const GOAL_ARTWORK_LAYOUT = {
  referenceScreenHeight: 852,
  topFromScreen: 122,
  width: 330,
  height: 347,
  horizontalOpticalOffset: -7,
  cardOverlap: 113,
} as const;

export default function OnboardingGoalScreen() {
  const [hours, setHours] = useState(INITIAL_GOAL_HOURS);
  const { save, pending, errorMessage } = useSaveGoalTime('onboarding');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const screenHeightShortfall = Math.max(
    GOAL_ARTWORK_LAYOUT.referenceScreenHeight - screenHeight,
    0
  );
  const artworkTopWithinSafeArea =
    GOAL_ARTWORK_LAYOUT.topFromScreen - screenHeightShortfall - insets.top;
  const artworkTopPadding = Math.max(artworkTopWithinSafeArea, spacing[16]);
  const complete = async () => {
    if (await save(hours * MINUTES_PER_HOUR)) router.replace('/onboarding-invite');
  };
  return (
    <LoggingPage
      eventName="Onboarding Viewed"
      properties={{ pageName: 'Onboarding', step: 'goal' }}
    >
      <OnboardingLayout
        footer={<OnboardingContinueButton label="완료" disabled={pending} onPress={complete} />}
      >
        <View style={[styles.body, { paddingTop: artworkTopPadding }]}>
          <Image source={require('@assets/onboarding/goal.png')} style={styles.image} />
          <View style={styles.card}>
            <GoalTimeCard hours={hours} onChange={setHours} showChangeHint />
          </View>
          {errorMessage && (
            <Text style={styles.error} accessibilityRole="alert">
              {errorMessage}
            </Text>
          )}
        </View>
      </OnboardingLayout>
    </LoggingPage>
  );
}
const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing[16], paddingBottom: spacing[24] },
  image: {
    width: GOAL_ARTWORK_LAYOUT.width,
    height: GOAL_ARTWORK_LAYOUT.height,
    alignSelf: 'center',
    marginLeft: GOAL_ARTWORK_LAYOUT.horizontalOpticalOffset,
  },
  card: { marginTop: -GOAL_ARTWORK_LAYOUT.cardOverlap },
  error: {
    marginTop: spacing[12],
    fontFamily: fontFamily.primary.medium,
    color: primitiveColors.system.red.opacity100,
    textAlign: 'center',
  },
});
