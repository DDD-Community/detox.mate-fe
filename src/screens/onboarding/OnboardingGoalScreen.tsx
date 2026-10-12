import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LoggingPage } from '@/components';
import { fontFamily, primitiveColors, spacing } from '@/lib/token';
import { GoalTimeCard } from '../lock/GoalTimeCard';
import { useSaveGoalTime } from '../lock/useSaveGoalTime';
import { OnboardingLayout } from './OnboardingLayout';
import { OnboardingContinueButton } from './OnboardingContinueButton';

const INITIAL_GOAL_HOURS = 0;
const MINUTES_PER_HOUR = 60;

export default function OnboardingGoalScreen() {
  const [hours, setHours] = useState(INITIAL_GOAL_HOURS);
  const { save, pending, errorMessage } = useSaveGoalTime('onboarding');
  const router = useRouter();
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
        <View style={styles.body}>
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
  body: { paddingHorizontal: spacing[16], paddingVertical: spacing[24] },
  image: {
    width: 330,
    height: 347,
    alignSelf: 'center',
  },
  card: { marginTop: -113 },
  error: {
    marginTop: spacing[12],
    fontFamily: fontFamily.primary.medium,
    color: primitiveColors.system.red.opacity100,
    textAlign: 'center',
  },
});
