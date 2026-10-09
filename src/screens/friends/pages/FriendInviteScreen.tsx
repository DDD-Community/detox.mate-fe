import { QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { normalizeError } from '../../../api/errors';
import { getGetInviteeSuspenseQueryOptions } from '../../../api/query-generated/friend';
import { ErrorBoundary } from '../../../components/AppErrorBoundary/AppErrorBoundary';
import { LoggingButton } from '../../../components/LoggingButton/LoggingButton';
import { fontFamily } from '../../../lib/token/primitive/fonts';
import { FriendsErrorFeedback } from '../components/FriendsErrorFeedback';
import { useFriendInvite } from '../hooks/useFriendInvite';
import defaultAvatar from '@assets/friend-invite/default-avatar.svg';
import detoxLogo from '@assets/friend-invite/detox.svg';
import mateLogo from '@assets/friend-invite/mate.svg';

const friends = () => router.replace('/(group)/friends');

function InviteButton({
  label,
  onPress,
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabledButton]}
    >
      {busy ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

function InviteLayout({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 59 },
      ]}
    >
      <View style={styles.header} accessibilityLabel="Detoxmate">
        <View style={styles.logo}>
          <Image
            source={detoxLogo}
            style={{ width: 47.7617, height: 13.5168 }}
            contentFit="contain"
          />
          <Image
            source={mateLogo}
            style={{ width: 45.5715, height: 13.0564, marginTop: 0.71 }}
            contentFit="contain"
          />
        </View>
      </View>
      {children}
    </ScrollView>
  );
}

export function UnusableFriendInvite() {
  return (
    <InviteLayout>
      <View style={styles.unusable}>
        <Text style={styles.title}>사용할 수 없는 초대 링크예요.</Text>
        <Text style={styles.errorDescription}>친구에게 새 초대 링크를 받아보세요.</Text>
      </View>
      <LoggingButton
        eventName="Friend Invite Friends Open Clicked"
        properties={{ pageName: 'FriendInvite', buttonName: '친구 목록으로' }}
      >
        <InviteButton label="친구 목록으로" onPress={friends} />
      </LoggingButton>
    </InviteLayout>
  );
}

function InviteProfile({ code }: { code: string }) {
  const { invitee, sending, sendError, readError, sendRequest, refresh } = useFriendInvite(code);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [invitee.profileImageUrl]);
  const status = invitee.relationshipStatus;
  const confirmSend = () => {
    if (sending) return;
    Alert.alert(
      '친구 요청 보내기',
      `${invitee.displayName}님과 친구가 되면 지금까지의 모든 활동 기록을 서로 볼 수 있어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '친구 요청 보내기',
          onPress: () => {
            void sendRequest();
          },
        },
      ]
    );
  };
  const label =
    status === 'PENDING_SENT'
      ? '요청됨'
      : status === 'PENDING_RECEIVED'
        ? '받은 요청 확인'
        : status === 'NONE'
          ? '친구 요청 보내기'
          : '친구 목록으로';
  const action = (
    <InviteButton
      label={label}
      disabled={sending || status === 'PENDING_SENT'}
      busy={sending}
      onPress={status === 'NONE' ? confirmSend : friends}
    />
  );
  return (
    <InviteLayout>
      <View style={styles.profileCard}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" aria-hidden>
          <Defs>
            <LinearGradient id="inviteBackground" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#5a8974" stopOpacity={0.2} />
              <Stop offset="0.71154" stopColor="#acc4b9" stopOpacity={0.1} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={23} fill="url(#inviteBackground)" />
        </Svg>
        <Image
          source={
            invitee.profileImageUrl && !imageFailed
              ? { uri: invitee.profileImageUrl }
              : defaultAvatar
          }
          style={styles.avatar}
          contentFit="cover"
          onError={() => setImageFailed(true)}
          accessibilityLabel={`${invitee.displayName} 프로필 사진`}
        />
        <Text style={styles.name} numberOfLines={2}>
          {invitee.displayName}
        </Text>
        <Text style={styles.invitation}>{invitee.displayName}님과 스크린타임을 줄여봐요.</Text>
        {status === 'SELF' || status === 'FRIEND' ? (
          <Text style={styles.status}>
            {status === 'SELF' ? '내 초대 링크예요.' : '이미 친구예요.'}
          </Text>
        ) : null}
      </View>
      <View style={styles.feedback}>
        {sendError ? (
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {sendError}
          </Text>
        ) : null}
        {readError ? (
          <FriendsErrorFeedback
            error={readError}
            onRetry={() => {
              void refresh();
            }}
          />
        ) : null}
      </View>
      {status === 'NONE' || status === 'PENDING_SENT' ? (
        action
      ) : (
        <LoggingButton
          eventName="Friend Invite Friends Open Clicked"
          properties={{ pageName: 'FriendInvite', buttonName: label }}
        >
          {action}
        </LoggingButton>
      )}
    </InviteLayout>
  );
}

export default function FriendInviteScreen({ code }: { code: string }) {
  const client = useQueryClient();
  const options = getGetInviteeSuspenseQueryOptions(code);
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={async () => {
            reset();
            await client.resetQueries({ queryKey: options.queryKey, exact: true });
          }}
          fallback={(error, retry) =>
            normalizeError(error).type === 'notFound' ? (
              <UnusableFriendInvite />
            ) : (
              <InviteLayout>
                <View style={styles.unusable}>
                  <FriendsErrorFeedback error={error} onRetry={retry} />
                </View>
                <LoggingButton
                  eventName="Friend Invite Friends Open Clicked"
                  properties={{ pageName: 'FriendInvite', buttonName: '친구 목록으로' }}
                >
                  <InviteButton label="친구 목록으로" onPress={friends} />
                </LoggingButton>
              </InviteLayout>
            )
          }
        >
          <Suspense
            fallback={
              <View style={styles.loading}>
                <ActivityIndicator color="#5a8974" accessibilityLabel="초대 정보 불러오는 중" />
              </View>
            }
          >
            <InviteProfile code={code} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  content: { flexGrow: 1, alignItems: 'center' },
  header: { height: 56, justifyContent: 'center', alignItems: 'center', width: '100%' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 4.9983 },
  profileCard: {
    width: '85.07%',
    maxWidth: 420,
    minHeight: 536,
    marginTop: 25,
    alignItems: 'center',
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  avatar: { width: 180, height: 180, borderRadius: 90, marginTop: 69 },
  name: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 28,
    lineHeight: 38,
    color: '#383e49',
    marginTop: 40,
    textAlign: 'center',
  },
  invitation: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 20,
    lineHeight: 28,
    color: 'black',
    marginTop: 40,
    textAlign: 'center',
  },
  status: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 16,
    lineHeight: 24,
    color: '#667085',
    marginTop: 20,
    textAlign: 'center',
  },
  feedback: { flexGrow: 1, minHeight: 28, width: '85.07%', justifyContent: 'center' },
  errorText: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#9d4e4e',
    textAlign: 'center',
    paddingVertical: 8,
  },
  button: {
    width: '74.4%',
    maxWidth: 368,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#5a8974',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: { backgroundColor: '#c5d0cb' },
  buttonText: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 17.39,
    lineHeight: 26.092,
    letterSpacing: -0.3478,
    color: 'white',
    textAlign: 'center',
  },
  unusable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 300,
  },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    lineHeight: 28,
    color: '#383e49',
    textAlign: 'center',
  },
  errorDescription: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#667085',
    marginTop: 8,
    textAlign: 'center',
  },
  loading: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
});
