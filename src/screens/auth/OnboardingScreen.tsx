import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';

const { green, gray, brown } = primitiveColors;

const PAGES = [
  {
    image: require('../../../assets/turtle-hollow.png'),
    title: '스크린타임,\n혼자선 못 줄여요',
    subtitle: '디톡스 메이트는 친구들과 함께\n매일 디지털 디톡스를 인증하는 앱이에요',
    info: '디지털 디톡스란? 디지털 기기 사용을 중단하고 휴식을 취하는 것',
  },
  {
    image: require('../../../assets/turtle-with-ai.png'),
    title: '매일 어제의\n스크린타임을 인증해요',
    subtitle: '스크린샷을 올리면 AI가 분석해요\n실패하면 한 줄 반성문을 남겨야 해요',
    info: null,
  },
  {
    image: require('../../../assets/turtle-fire.png'),
    title: '모두 인증에 성공하면\n그룹 스트릭이 올라가요',
    subtitle: '스크린샷을 올리면 AI가 분석해요\n실패하면 한 줄 반성문을 남겨야 해요',
    info: null,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const page = PAGES[step];
  const isFirst = step === 0;
  const isLast = step === PAGES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await SecureStore.setItemAsync('isNewUser', 'true');
      router.replace('/home');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.stepIndicator}>
        {PAGES.map((_, i) => {
          const isActive = i === step;
          const isStar = i === PAGES.length - 1;
          return (
            <Image
              key={i}
              source={
                isStar
                  ? isActive
                    ? require('../../../assets/onboarding-star-green.png')
                    : require('../../../assets/onboarding-star-gray.png')
                  : isActive
                    ? require('../../../assets/onboarding-step-green.png')
                    : require('../../../assets/onboarding-step-gray.png')
              }
              style={isStar ? styles.stepDotStar : styles.stepDot}
              resizeMode="contain"
            />
          );
        })}
      </View>

      <View style={styles.imageSection}>
        <Image source={page.image} style={styles.characterImage} resizeMode="contain" />
      </View>

      <View style={styles.textSection}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </View>

      <View style={[styles.buttonSection, !isFirst && styles.buttonRow]}>
        {!isFirst && (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={() => setStep((s) => s - 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.prevText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, !isFirst && styles.nextButtonFlex]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{isLast ? '시작하기' : '다음'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 100,
  },
  stepDot: {
    width: 10,
    height: 10,
  },
  stepDotStar: {
    width: 14,
    height: 14,
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterImage: {
    marginTop: 70,
    width: 280,
    height: 280,
  },
  textSection: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    marginBottom: 70,
  },
  title: {
    ...typography.primary.h2,
    color: gray[900],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[600],
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  infoIcon: {
    fontSize: 12,
    color: gray[400],
    lineHeight: 18,
  },
  infoText: {
    ...typography.primary.caption,
    color: gray[400],
    flex: 1,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prevButton: {
    flex: 2,
    backgroundColor: gray[700],
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: green[400],
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFlex: {
    flex: 3,
  },
  nextText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
});
