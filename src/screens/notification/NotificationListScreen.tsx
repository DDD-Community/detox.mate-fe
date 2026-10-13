import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { isCancel } from 'axios';
import { router, type Href } from 'expo-router';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logError, normalizeError } from '@/api/errors';
import { getNotificationHistory } from '@/api/notification-query/notifications';
import { Icon, LoggingButton, LoggingPage, Toast, useToastVisibility } from '@/components';
import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from '@/screens/mypage/components/ProfileAvatar';
import { formatNotificationTime } from './notificationSections';
import { useNotifications } from './useNotifications';

const { gray } = primitiveColors;
const EMPTY_IMAGE = require('../../../assets/onboarding-none-feed.png');

export default function NotificationListScreen() {
  return (
    <LoggingPage eventName="Notification List Viewed" properties={{ pageName: 'NotificationList' }}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <LoggingButton
            eventName="Notification List Back Clicked"
            properties={{ pageName: 'NotificationList', buttonName: '뒤로가기' }}
          >
            <Pressable
              onPress={() => goBackOrReplace('/restricted-apps')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
            >
              <Icon name="caretLeft" size={24} color={gray[800]} />
            </Pressable>
          </LoggingButton>
          <Text style={styles.headerTitle}>알림</Text>
        </View>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary onReset={reset}>
              <Suspense
                fallback={
                  <View style={styles.center}>
                    <ActivityIndicator color={gray[400]} accessibilityLabel="알림 불러오는 중" />
                  </View>
                }
              >
                <NotificationList />
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </SafeAreaView>
    </LoggingPage>
  );
}

function NotificationList() {
  const sections = useNotifications();
  const navigationRequest = useRef<AbortController | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const { visible, message, showWithMessage } = useToastVisibility(2500);

  useEffect(() => () => navigationRequest.current?.abort(), []);

  const openNotification = async (id: number) => {
    if (navigationRequest.current) return;
    const request = new AbortController();
    navigationRequest.current = request;
    setOpeningId(id);
    try {
      const destination = await getNotificationHistory(id, request.signal);
      if (request.signal.aborted) return;
      if (!destination.navigable || !destination.url) {
        showWithMessage('이동할 수 없는 알림이에요');
        return;
      }
      router.push(destination.url as Href);
    } catch (error) {
      if (isCancel(error) || request.signal.aborted) return;
      logError(normalizeError(error), {
        scope: 'notification.navigation',
        operation: 'openNotification',
      });
      showWithMessage('알림을 열지 못했어요. 다시 시도해 주세요');
    } finally {
      navigationRequest.current = null;
      if (!request.signal.aborted) setOpeningId(null);
    }
  };

  return (
    <View style={styles.list}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={sections.length ? styles.listContent : styles.emptyContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Image source={EMPTY_IMAGE} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyText}>아직 알림이 없어요</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <LoggingButton
            eventName="Notification List Notification Item Open Clicked"
            properties={{ pageName: 'NotificationList', buttonName: '알림 항목' }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: openingId !== null, busy: openingId === item.id }}
              disabled={openingId !== null}
              onPress={() => {
                if (item.id !== undefined) void openNotification(item.id);
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <ProfileAvatar size={48} />
              <View style={styles.rowBody}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timeLabel}>
                  {item.createdAt ? formatNotificationTime(item.createdAt) : ''}
                </Text>
              </View>
            </Pressable>
          </LoggingButton>
        )}
      />
      <Toast visible={visible} message={message} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
  },
  headerTitle: { ...typography.primary.title1B, color: gray[800] },
  list: { flex: 1 },
  listContent: { paddingTop: spacing[24], paddingBottom: spacing[24] },
  emptyContent: { flexGrow: 1 },
  sectionTitle: {
    ...typography.primary.body2R,
    color: gray[800],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
  },
  rowPressed: { opacity: 0.6 },
  rowBody: { flex: 1, gap: spacing[4] },
  message: { ...typography.primary.body1M, color: gray[800] },
  timeLabel: { ...typography.primary.body3R, color: gray[400] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[12] },
  emptyImage: { width: 87, height: 88 },
  emptyText: { ...typography.primary.body2R, color: gray[400], textAlign: 'center' },
});
