import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/client';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';

const { green, gray, brown } = primitiveColors;

export default function GroupJoinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canComplete = inviteCode.length === 5;

  const handleCodeChange = (text: string) => {
    setInviteCode(text.toUpperCase().slice(0, 5));
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
        setError('이미 참여한 그룹이에요');
      } else if (status === 404) {
        setError('유효하지 않은 초대 코드예요');
      } else {
        setError('그룹 참여에 실패했어요. 다시 시도해 주세요');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
  };

  const handleShare = async () => {
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${inviteCode}`,
    });
  };

  const handleGoToFeed = () => {
    router.replace('/home');
  };

  return (
    <View style={styles.root}>
      <View style={styles.progressRow}>
        <View style={[styles.segment, styles.segmentActive]} />
        <View
          style={[styles.segment, step === 2 ? styles.segmentActive : styles.segmentInactive]}
        />
      </View>
      <Text style={styles.stepLabel}>{step}/2</Text>

      {step === 1 ? (
        <View style={styles.content}>
          <Text style={styles.title}>공유받은 초대 코드를{'\n'}입력하세요</Text>

          <View style={styles.gap24} />

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={handleCodeChange}
              placeholder="초대 코드를 입력해 주세요"
              placeholderTextColor={gray[300]}
              autoCapitalize="characters"
              maxLength={5}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      ) : (
        <View style={styles.content}>
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
                <Image
                  source={require('../../../assets/onboarding-copy.png')}
                  style={styles.copyIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.shareInCard} onPress={handleShare} activeOpacity={0.8}>
              <Image
                source={require('../../../assets/onboarding-share-black.png')}
                style={styles.shareIcon}
                resizeMode="contain"
              />
              <Text style={styles.shareText}>친구에게 공유하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.prevText}>이전</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && !canComplete && styles.nextButtonDisabled]}
          onPress={step === 1 ? handleComplete : handleGoToFeed}
          disabled={step === 1 && !canComplete}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{step === 1 ? '완료' : '그룹 피드로 가기'}</Text>
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
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentActive: {
    backgroundColor: green[400],
  },
  segmentInactive: {
    backgroundColor: green[75],
  },
  stepLabel: {
    ...typography.primary.caption,
    color: gray[400],
    paddingHorizontal: 24,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  gap24: { height: 24 },
  title: {
    ...typography.primary.h2,
    color: gray[900],
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    ...typography.primary.caption,
    color: '#E53935',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  input: {
    ...typography.primary.body1R,
    color: gray[900],
    padding: 0,
    letterSpacing: 3,
  },
  checkImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  completeTitle: {
    ...typography.primary.h2,
    color: gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    ...typography.primary.body2R,
    color: gray[600],
    textAlign: 'center',
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  codeLabel: {
    ...typography.primary.body2R,
    color: gray[600],
  },
  codeText: {
    ...typography.primary.title1B,
    color: gray[900],
    letterSpacing: 2,
  },
  copyIcon: {
    width: 20,
    height: 20,
  },
  shareInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: gray[50],
    borderRadius: 10,
    paddingVertical: 12,
  },
  shareIcon: {
    width: 18,
    height: 18,
  },
  shareText: {
    ...typography.primary.body2M,
    color: gray[900],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
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
    flex: 3,
    backgroundColor: green[400],
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: gray[200],
  },
  nextText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
});
