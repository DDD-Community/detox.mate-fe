import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { getNotificationHistory } from '../../api/generated/notification-history/notification-history';
import { Icon } from '../../components/Icon';
import type {
  NotificationHistoryItemResponse,
  NotificationHistoryListResponse,
} from '../../api/generated/model';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { brown, gray } = primitiveColors;

const DEFAULT_AVATAR = require('../../../assets/turtle-hi.png');
const EMPTY_IMAGE = require('../../../assets/onboarding-none-feed.png');

interface NotificationSection {
  title: string;
  data: NotificationHistoryItemResponse[];
}

const formatRelativeTime = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  return `${diffDay}일 전`;
};

const formatMessage = (item: NotificationHistoryItemResponse): string => {
  if (item.title && item.message) return `${item.title}\n${item.message}`;
  return item.title ?? item.message ?? '';
};

const TOAST_DURATION_MS = 2500;

const routeByTarget = (type?: string, id?: number) => {
  // 백엔드 enum 기준 라우팅.
  switch (type) {
    case 'FEED':
      // targetId: groupChallengeId
      router.push({
        pathname: '/(feed)/home',
        params: id != null ? { groupChallengeId: String(id) } : undefined,
      });
      return;
    case 'FEED_DETAIL':
      // targetId: challengeRecordId — 별도 상세 화면이 없어 피드로 보내며 파라미터 전달
      router.push({
        pathname: '/(feed)/home',
        params: id != null ? { challengeRecordId: String(id) } : undefined,
      });
      return;
    case 'GROUP':
      // targetId: groupId
      router.push({
        pathname: '/(group)/group-info',
        params: id != null ? { groupId: String(id) } : undefined,
      });
      return;
    case 'NONE':
    default:
      // 이동 없음
      return;
  }
};

export default function NotificationListScreen() {
  const [sections, setSections] = useState<NotificationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response: NotificationHistoryListResponse =
          await getNotificationHistory().getMyNotifications();
        if (cancelled) return;
        const next: NotificationSection[] = (response.groups ?? []).map((g) => ({
          title: g.label ?? '',
          data: g.notifications ?? [],
        }));
        setSections(next);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isEmpty = !isLoading && sections.every((s) => s.data.length === 0);

  const handleBack = () => {
    router.back();
  };

  const handlePressItem = async (item: NotificationHistoryItemResponse) => {
    if (!item.id) return;
    const nav = await getNotificationHistory().getNotificationHistory(item.id);
    if (!nav.navigable) {
      showToast(nav.reason ?? '이동할 수 없는 알림이에요');
      return;
    }
    routeByTarget(nav.targetType, nav.targetId);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Icon name="caretLeft" size={24} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle}>알림</Text>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <Image source={EMPTY_IMAGE} style={styles.emptyImage} resizeMode="contain" />
          <Text style={styles.emptyText}>아직 알림이 없어요</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => String(item.id ?? index)}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePressItem(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Image source={DEFAULT_AVATAR} style={styles.avatar} resizeMode="cover" />
              <View style={styles.rowBody}>
                <Text style={styles.message}>{formatMessage(item)}</Text>
                <Text style={styles.timeLabel}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {toastMessage && (
        <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  listContent: {
    paddingBottom: spacing[40],
  },
  sectionHeader: {
    height: 40,
    paddingHorizontal: spacing[16],
    justifyContent: 'center',
    backgroundColor: brown[50],
  },
  sectionHeaderText: {
    ...typography.accent.body2,
    color: gray[800],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
  },
  rowPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: gray[100],
  },
  rowBody: {
    flex: 1,
    gap: spacing[4],
  },
  message: {
    ...typography.primary.body2B,
    color: gray[800],
  },
  timeLabel: {
    ...typography.primary.body3R,
    color: gray[400],
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
  },
  emptyImage: {
    width: 87,
    height: 88,
  },
  emptyText: {
    ...typography.accent.body2,
    color: gray[400],
    textAlign: 'center',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  toast: {
    maxWidth: 343,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: 'rgba(43, 47, 56, 0.8)',
    borderRadius: radius[16],
  },
  toastText: {
    ...typography.primary.body3R,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
