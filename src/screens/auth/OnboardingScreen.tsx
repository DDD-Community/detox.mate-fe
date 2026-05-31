import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';

const { green, gray, brown } = primitiveColors;

const PAGES = [
  {
    image: require('../../../assets/turtle-hollow.png'),
    imageStyle: { width: 218, height: 247, top: 199 },
    title: '스크린 타임,\n혼자선 못 줄여요',
    subtitle: '디톡스 메이트는 친구들과 함께\n매일 디지털 디톡스를 인증하는 앱이에요',
    info: '디지털 디톡스란? 디지털 기기 사용을 중단하고 휴식을 취하는 것',
  },
  {
    image: require('../../../assets/turtle-with-ai.png'),
    imageStyle: { width: 288, height: 251, top: 195 },
    title: '매일 어제의\n스크린 타임을 인증해요',
    subtitle: '스크린샷을 올리면 스크린 타임을 분석해요\n실패하면 한 줄 반성문을 남겨야 해요',
    info: null,
  },
  {
    image: require('../../../assets/turtle-fire.png'),
    imageStyle: { width: 216, height: 264, top: 182 },
    title: '모두가 인증하면\n그룹 스트릭이 올라가요',
    subtitle: '멤버 절반 이상이 인증해도\n그룹 스트릭을 유지할 수 있어요',
    info: '그룹 스트릭이란? 인증에 성공한 날이 연속으로 이어지는 것을 말해요.',
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
      router.replace('/terms-agreement');
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

      <Image
        source={page.image}
        style={[styles.characterImage, page.imageStyle]}
        resizeMode="contain"
      />

      <View style={styles.textSection}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </View>

      {page.info ? (
        <View style={styles.infoBox}>
          <Image
            source={require('../../../assets/onboarding-info.png')}
            style={styles.infoIcon}
            resizeMode="contain"
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {page.info}
          </Text>
        </View>
      ) : null}

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
    position: 'absolute',
    top: 79,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
  },
  stepDotStar: {
    width: 12,
    height: 12,
  },
  characterImage: {
    position: 'absolute',
    alignSelf: 'center',
  },
  textSection: {
    position: 'absolute',
    top: 486,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
    textAlign: 'center',
  },
  infoBox: {
    position: 'absolute',
    top: 669,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  infoIcon: {
    width: 14,
    height: 14,
  },
  infoText: {
    ...typography.accent.caption,
    color: gray[500],
    letterSpacing: -0.26,
    flexShrink: 1,
  },
  buttonSection: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prevButton: {
    width: 108,
    height: 50,
    backgroundColor: brown[900],
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
  nextButton: {
    height: 50,
    backgroundColor: green[300],
    borderRadius: 18,
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
