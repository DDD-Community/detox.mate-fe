import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown } = primitiveColors;

function formatHHMMToDisplay(value: string | undefined): string {
  if (!value) return '';
  const [hStr, mStr] = value.split(':');
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  return `${h}h ${m}m`;
}

export default function VerifyDoneScreen() {
  const { value } = useLocalSearchParams<{ value?: string }>();
  const display = formatHHMMToDisplay(value);

  const handleSetGoal = () => {
    router.replace({
      pathname: '/(group)/goal',
      params: value ? { value } : undefined,
    });
  };

  return (
    <Pressable style={styles.overlay} onPress={() => router.back()}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.content}>
          <View style={styles.heading}>
            <Image
              source={require('../../../../assets/onboarding-check.png')}
              style={styles.checkIcon}
              resizeMode="contain"
            />
            <Text style={styles.title}>분석 완료 !</Text>
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>내 스크린타임</Text>
            <Text style={styles.summaryValue}>{display}</Text>
          </View>

          <Button
            label="개인 목표 설정하기"
            color="primary"
            onPress={handleSetGoal}
            style={styles.button}
          />
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: brown[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grabberWrap: {
    paddingTop: 5,
    paddingBottom: 11,
    alignItems: 'center',
  },
  grabber: {
    width: 52,
    height: 5,
    borderRadius: 100,
    backgroundColor: gray[100],
  },
  content: {
    gap: 40,
  },
  heading: {
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 60,
    height: 60,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    textAlign: 'center',
    letterSpacing: -0.52,
  },
  summary: {
    backgroundColor: gray[50],
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.primary.body3R,
    color: gray[500],
    letterSpacing: -0.24,
  },
  summaryValue: {
    ...typography.primary.body1B,
    color: gray[500],
    letterSpacing: -0.32,
  },
  button: {
    alignSelf: 'stretch',
  },
});
