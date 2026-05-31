import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '../Icon';
import { Toast } from '../Toast';
import { useNetworkErrorToastStore } from '../../stores/networkErrorToastStore';
import { primitiveColors, typography } from '../../lib/token';

const { system } = primitiveColors;

const NETWORK_ERROR_MESSAGE = '네트워크 연결 상태 확인 후, 다시 시도해주세요';

export function NetworkErrorToast() {
  const visible = useNetworkErrorToastStore((s) => s.visible);
  const hasRetryQueue = useNetworkErrorToastStore((s) => s.pending.length > 0);
  const message = useNetworkErrorToastStore((s) => s.message);
  const retryAll = useNetworkErrorToastStore((s) => s.retryAll);
  const dismiss = useNetworkErrorToastStore((s) => s.dismiss);

  if (!visible) return null;

  // 네트워크 재시도 큐가 있으면 재시도 토스트, 없으면 일반 메시지 토스트
  const text = hasRetryQueue ? NETWORK_ERROR_MESSAGE : (message ?? '');

  return (
    <Toast
      visible={visible}
      message={text}
      icon={<Icon name="warningCircle" size={16} weight="fill" color={system.red.opacity100} />}
      fullWidth
      actions={
        <>
          {hasRetryQueue && (
            <Pressable onPress={retryAll} hitSlop={8}>
              <Text style={styles.retry}>재시도</Text>
            </Pressable>
          )}
          <Pressable onPress={dismiss} hitSlop={8}>
            <Text style={styles.close}>닫기</Text>
          </Pressable>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
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
