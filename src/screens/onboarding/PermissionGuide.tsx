import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, primitiveColors } from '@/lib/token';
import { OnboardingLayout } from './OnboardingLayout';
import { OnboardingContinueButton } from './OnboardingContinueButton';

type Props = {
  title: string;
  image: ImageSourcePropType;
  notification?: boolean;
  pending: boolean;
  onContinue: () => void;
};
export function PermissionGuide({ title, image, notification, pending, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <OnboardingLayout
      footer={
        <OnboardingContinueButton
          label={notification ? '시작하기' : '다음'}
          disabled={pending}
          onPress={onContinue}
        />
      }
    >
      <View style={[styles.body, { paddingTop: Math.max(230 - insets.top, 24) }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          다음 화면에서{' '}
          <Text style={styles.highlight}>‘{notification ? '허용' : '계속'}&apos;</Text>을
          눌러주세요.
        </Text>
        {notification && (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              잠긴 앱을 풀 때와 친구 소식을{'\n'}알림으로 알려드려요
            </Text>
          </View>
        )}
        <View style={[styles.artwork, notification && styles.notificationArtwork]}>
          <Image
            source={image}
            style={notification ? styles.notificationImage : styles.screenTimeImage}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}
const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingBottom: 16, overflow: 'hidden' },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 22,
    lineHeight: 30,
    color: primitiveColors.gray[900],
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  description: {
    marginTop: 12,
    fontFamily: fontFamily.primary.medium,
    fontSize: 16,
    lineHeight: 26,
    color: primitiveColors.gray[800],
    textAlign: 'center',
  },
  highlight: { fontFamily: fontFamily.primary.bold, color: primitiveColors.green[300] },
  bubble: {
    marginTop: 36,
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
  artwork: { marginTop: 36, width: 396, height: 226, overflow: 'hidden' },
  notificationArtwork: { marginTop: 24, width: 435, height: 272 },
  screenTimeImage: { position: 'absolute', width: 396, height: 274, left: 0, top: -48 },
  notificationImage: {
    position: 'absolute',
    width: 435.61,
    height: 655.14,
    left: -0.3,
    top: -371.23,
  },
});
