import { QueryErrorResetBoundary } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useRouter, type Href } from 'expo-router';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import {
  Button,
  ClipboardCopyToast,
  LoggingButton,
  LoggingPage,
  useClipboardCopyToast,
} from '@/components';
import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { trackEvent } from '@/lib/analytics';
import { navigateAuthenticated } from '@/lib/inviteDestination';
import { fontFamily, primitiveColors, spacing } from '@/lib/token';
import { useShareFriendInvite } from '../friends/hooks/useShareFriendInvite';
import { useMyProfile } from '../mypage/hooks/useMyProfilePageData';
import { OnboardingLayout } from './OnboardingLayout';

export default function OnboardingInviteScreen() {
  const router = useRouter();
  const { share, sharing } = useShareFriendInvite({
    prepareOnMount: false,
    pageName: 'Onboarding',
  });
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const finish = async (destination: Href) => {
    if (busy.current) return;
    busy.current = true;
    setLeaving(true);
    try {
      await navigateAuthenticated({
        replace: (value) => router.replace(value),
        resolveDefault: async () => destination,
        isActive: () => active.current,
      });
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'app.bootstrap', operation: 'finishOnboarding' });
      if (active.current) Alert.alert('화면을 이동할 수 없어요', getUserErrorMessage(appError));
    } finally {
      busy.current = false;
      if (active.current) setLeaving(false);
    }
  };
  return (
    <LoggingPage
      eventName="Onboarding Viewed"
      properties={{ pageName: 'Onboarding', step: 'invite' }}
    >
      <OnboardingLayout
        footer={
          <View style={styles.actions}>
            <Button
              label="프로필 공유하기"
              disabled={sharing}
              onPress={share}
              style={styles.button}
            />
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>
            <LoggingButton
              eventName="Onboarding Friends Search Clicked"
              properties={{ pageName: 'Onboarding', buttonName: '친구 코드로 추가하기' }}
            >
              <Button
                label="친구 코드로 추가하기"
                variant="outlined"
                disabled={leaving}
                onPress={() => finish({ pathname: '/(tabs)/friends', params: { search: '1' } })}
                style={styles.button}
              />
            </LoggingButton>
          </View>
        }
      >
        <View style={styles.header}>
          <LoggingButton
            eventName="Onboarding Skip Clicked"
            properties={{ pageName: 'Onboarding', buttonName: '건너뛰기' }}
          >
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              disabled={leaving}
              onPress={() => finish('/(tabs)/restricted-apps')}
            >
              <Text style={styles.skip}>건너뛰기</Text>
            </Pressable>
          </LoggingButton>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>친구를 초대하고{'\n'}함께 시작해 보세요</Text>
          <Text style={styles.subtitle}>
            친구가 내 초대 코드로 나를 찾아{'\n'}친구 요청을 보낼 수 있어요
          </Text>
          <View style={styles.artwork}>
            <Image source={require('@assets/onboarding/invite.png')} style={styles.image} />
          </View>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary onReset={reset}>
                <Suspense fallback={<ActivityIndicator style={styles.loading} />}>
                  <InviteCode />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </View>
      </OnboardingLayout>
    </LoggingPage>
  );
}
function InviteCode() {
  const { userCode } = useMyProfile();
  const { copyToastVisible, showCopyToast } = useClipboardCopyToast();
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(userCode);
      trackEvent('Onboarding Invite Code Copy Clicked', { page_name: 'Onboarding' });
      showCopyToast();
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'api', operation: 'copyOnboardingInviteCode' });
      Alert.alert('코드를 복사할 수 없어요', getUserErrorMessage(appError));
    }
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="내 초대 코드 복사"
        onPress={copy}
        style={styles.codeArea}
      >
        <Text style={styles.codeLabel}>내 초대 코드 복사</Text>
        <Text style={styles.code}>{userCode}</Text>
      </Pressable>
      <ClipboardCopyToast visible={copyToastVisible} bottomOffset={0} />
    </>
  );
}
const styles = StyleSheet.create({
  header: { height: 24, paddingHorizontal: 20, alignItems: 'flex-end', justifyContent: 'center' },
  skip: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 14,
    lineHeight: 20,
    color: primitiveColors.gray[500],
  },
  body: { alignItems: 'center', paddingHorizontal: spacing[16], paddingVertical: spacing[24] },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    color: primitiveColors.gray[900],
  },
  subtitle: {
    marginTop: 16,
    fontFamily: fontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: primitiveColors.gray[400],
  },
  artwork: { width: 259, height: 205, marginTop: 24, overflow: 'hidden' },
  image: { position: 'absolute', width: 260.3, height: 261.15, left: -0.65, top: -27.43 },
  codeArea: { alignItems: 'center', marginTop: 24, gap: 8 },
  codeLabel: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
    color: primitiveColors.gray[500],
  },
  code: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 32,
    lineHeight: 44,
    color: primitiveColors.gray[900],
    textDecorationLine: 'underline',
  },
  loading: { height: 96 },
  actions: { gap: 12, paddingBottom: 25 },
  button: { width: '100%', borderRadius: 999 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: primitiveColors.gray[100] },
  or: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
    color: primitiveColors.gray[300],
  },
});
