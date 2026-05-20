import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNetworkErrorToastStore } from '../../stores/networkErrorToastStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { system } = primitiveColors;

const ICON = require('../../../assets/icons/fill/icon_fl_WarningCircle.png');

const NETWORK_ERROR_MESSAGE = '네트워크 연결 상태 확인 후, 다시 시도해주세요';

export function NetworkErrorToast() {
  const visible = useNetworkErrorToastStore((s) => s.visible);
  const hasRetryQueue = useNetworkErrorToastStore((s) => s.pending.length > 0);
  const message = useNetworkErrorToastStore((s) => s.message);
  const retryAll = useNetworkErrorToastStore((s) => s.retryAll);
  const dismiss = useNetworkErrorToastStore((s) => s.dismiss);

  if (!visible) return null;

  // 네트워크 재시도 큐가 있으면 재시도 토스트, 없으면 일반 메시지 토스트
  const text = hasRetryQueue ? NETWORK_ERROR_MESSAGE : message ?? '';

  return (
    <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.safeArea}>
      <View style={styles.toast}>
        <View style={styles.messageGroup}>
          <Image source={ICON} style={styles.icon} resizeMode="contain" />
          <Text style={styles.message}>{text}</Text>
        </View>
        <View style={styles.actions}>
          {hasRetryQueue && (
            <Pressable onPress={retryAll} hitSlop={8}>
              <Text style={styles.retry}>재시도</Text>
            </Pressable>
          )}
          <Pressable onPress={dismiss} hitSlop={8}>
            <Text style={styles.close}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[20],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: 'rgba(43, 47, 56, 0.8)',
    borderRadius: radius[16],
  },
  messageGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    flexShrink: 1,
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: system.red.opacity100,
  },
  message: {
    ...typography.primary.body3R,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[12],
    flexShrink: 0,
  },
  retry: {
    ...typography.primary.body3B,
    color: system.blue.opacity100,
  },
  close: {
    ...typography.primary.body3B,
    color: '#FFFFFF',
    opacity: 0.6,
  },
});
