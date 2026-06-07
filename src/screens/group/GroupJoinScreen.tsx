import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { ClipboardCopyToast, useClipboardCopyToast } from '../../components';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { green, gray, brown } = primitiveColors;
const INVITE_CODE_MAX_LENGTH = 5;

export default function GroupJoinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copyToastVisible, showCopyToast } = useClipboardCopyToast();

  const canComplete = inviteCode.length === INVITE_CODE_MAX_LENGTH;
  const isCompleteStep = step === 2;

  useEffect(() => {
    if (!isCompleteStep) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isCompleteStep]);

  const handleCodeChange = (text: string) => {
    setInviteCode(text.toUpperCase().slice(0, INVITE_CODE_MAX_LENGTH));
    setError(null);
  };

  const handleComplete = async () => {
    if (!canComplete || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/groups/join', { inviteCode });
      console.log(res);
      setGroupName(res.data.name);
      setStep(2);
    } catch (e: any) {
      const status = e?.response?.status;
      console.log(status);
      if (status === 409) {
        setError('초대 코드를 다시 확인해 주세요');
      } else if (status === 404) {
        setError('초대 코드를 다시 확인해 주세요');
      } else {
        setError('초대 코드를 다시 확인해 주세요');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    showCopyToast();
  };

  const handleShare = async () => {
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${inviteCode}`,
    });
  };

  const handleGoToFeed = () => {
    router.replace('/(feed)/home');
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ gestureEnabled: !isCompleteStep }} />
      <SafeAreaView edges={['top']} style={styles.topArea}>
        <View style={styles.progressRow}>
          <View style={[styles.segment, styles.segmentActive]} />
          <View
            style={[styles.segment, step === 2 ? styles.segmentActive : styles.segmentInactive]}
          />
        </View>
      </SafeAreaView>

      {step === 1 ? (
        <View style={styles.content}>
          <Text style={styles.stepLabel}>{step}/2</Text>
          <Text style={styles.title}>공유받은 초대 코드를{'\n'}입력하세요</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={handleCodeChange}
              placeholder="초대 코드를 입력해 주세요"
              placeholderTextColor={gray[300]}
              autoCapitalize="characters"
              maxLength={INVITE_CODE_MAX_LENGTH}
            />
            {error ? null : (
              <Text style={styles.counter}>
                {inviteCode.length}/{INVITE_CODE_MAX_LENGTH}
              </Text>
            )}
          </View>
          {error ? (
            <View style={styles.errorRow}>
              <Icon
                name="warningCircle"
                size={14}
                weight="fill"
                color={primitiveColors.system.red.opacity100}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.stepLabel}>{step}/2</Text>
          <Image
            source={require('../../../assets/onboarding-check.png')}
            style={styles.checkImage}
            resizeMode="contain"
          />
          <Text style={styles.completeTitle}>
            {groupName}
            {'\n'}그룹에 참여했어요!
          </Text>
          <Text style={styles.completeSubtitle}>
            초대 코드를 친구에게 공유해서 함께 시작해 보세요
          </Text>

          <View style={styles.gap24} />

          <View style={styles.inviteCard}>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>초대 코드</Text>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
                <Icon name="copy" size={20} color={gray[800]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.shareInCard} onPress={handleShare} activeOpacity={0.8}>
              <Icon name="shareFat" size={18} color={gray[900]} />
              <Text style={styles.shareText}>친구에게 공유하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={styles.buttonRow}>
        {!isCompleteStep ? (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.prevText}>이전</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.nextButton,
            step === 1 && (!canComplete || loading) && styles.nextButtonDisabled,
          ]}
          onPress={step === 1 ? handleComplete : handleGoToFeed}
          disabled={step === 1 && (!canComplete || loading)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{step === 1 ? '완료' : '그룹 피드로 가기'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ClipboardCopyToast visible={copyToastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  topArea: {
    paddingTop: 35,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[16],
  },
  segment: {
    flex: 1,
    height: 2,
    borderRadius: radius.full,
  },
  segmentActive: {
    backgroundColor: brown[900],
  },
  segmentInactive: {
    backgroundColor: brown[900],
    opacity: 0.1,
  },
  stepLabel: {
    ...typography.primary.body2R,
    color: gray[400],
    marginBottom: spacing[8],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[32],
  },
  gap24: { height: spacing[24] },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    marginBottom: spacing[40],
    letterSpacing: -0.52,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius[12],
    height: 50,
    paddingHorizontal: spacing[16],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[8],
  },
  errorText: {
    ...typography.accent.caption,
    color: primitiveColors.system.red.opacity100,
    letterSpacing: -0.26,
  },
  input: {
    flex: 1,
    fontFamily: typography.primary.body1R.fontFamily,
    fontSize: typography.primary.body1R.fontSize,
    fontWeight: typography.primary.body1R.fontWeight,
    color: gray[900],
    padding: 0,
  },
  counter: {
    ...typography.primary.body3R,
    color: gray[300],
    marginLeft: spacing[8],
    letterSpacing: -0.24,
  },
  checkImage: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginTop: 31,
    marginBottom: spacing[20],
  },
  completeTitle: {
    ...typography.accent.h3,
    color: gray[900],
    textAlign: 'center',
    marginBottom: spacing[12],
    letterSpacing: -0.52,
  },
  completeSubtitle: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius[12],
    padding: spacing[20],
    gap: spacing[20],
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  codeLabel: {
    ...typography.accent.body2,
    color: gray[500],
    letterSpacing: -0.31,
  },
  codeText: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.31,
  },
  shareInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: gray[50],
    borderRadius: 18,
    height: 44,
  },
  shareText: {
    ...typography.primary.body2B,
    color: gray[800],
    letterSpacing: -0.28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[8],
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: 26,
    backgroundColor: brown[50],
  },
  prevButton: {
    width: 108,
    minWidth: 88,
    height: 50,
    backgroundColor: brown[900],
    borderRadius: 18,
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
  nextButton: {
    flex: 1,
    minWidth: 88,
    height: 50,
    backgroundColor: green[300],
    borderRadius: 18,
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: green[400],
    opacity: 0.3,
  },
  nextText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
});
