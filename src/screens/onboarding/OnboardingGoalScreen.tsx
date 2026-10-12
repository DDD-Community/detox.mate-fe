import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, LoggingPage } from '@/components';
import { fontFamily, primitiveColors } from '@/lib/token';
import { GoalTimeCard } from '../lock/GoalTimeCard';
import { useSaveGoalTime } from '../lock/useSaveGoalTime';
import { OnboardingLayout } from './OnboardingLayout';

export default function OnboardingGoalScreen() {
  const [hours, setHours] = useState(0);
  const { save, pending, errorMessage } = useSaveGoalTime('onboarding');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const complete = async () => {
    if (await save(hours * 60)) router.replace('/onboarding-invite');
  };
  return (
    <LoggingPage
      eventName="Onboarding Viewed"
      properties={{ pageName: 'Onboarding', step: 'goal' }}
    >
      <OnboardingLayout
        footer={
          <Button
            label="완료"
            disabled={pending}
            onPress={complete}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          />
        }
      >
        <View style={[styles.body, { paddingTop: Math.max(122 - insets.top, 16) }]}>
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
  body: { paddingHorizontal: 16, paddingBottom: 24 },
  image: { width: 330, height: 347, alignSelf: 'center', marginLeft: -7 },
  card: { marginTop: -113 },
  buttonLabel: { fontSize: 17.62, lineHeight: 26.423, letterSpacing: -0.3524 },
  button: { width: '100%', borderRadius: 999, height: 52.46, minHeight: 52.46 },
  error: {
    marginTop: 12,
    fontFamily: fontFamily.primary.medium,
    color: primitiveColors.system.red.opacity100,
    textAlign: 'center',
  },
});
