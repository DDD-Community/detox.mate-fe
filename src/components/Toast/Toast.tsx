import { ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/lib/token';

export type ToastPosition = 'bottom' | 'aboveCta';

const DEFAULT_AUTO_HIDE_MS = 2500;
const POSITION_BOTTOM_OFFSETS = {
  bottom: 16,
  aboveCta: 138,
} as const satisfies Record<ToastPosition, number>;

interface ToastProps {
  visible: boolean;
  message: string;
  icon?: ReactNode;
  actions?: ReactNode;
  position?: ToastPosition;
  bottomOffset?: number;
  fullWidth?: boolean;
}

export function useToastVisibility(autoHideMs = DEFAULT_AUTO_HIDE_MS) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return clearTimer;
  }, []);

  const hide = () => {
    clearTimer();
    setVisible(false);
  };

  const show = () => {
    clearTimer();
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, autoHideMs);
  };

  const showWithMessage = (nextMessage: string) => {
    setMessage(nextMessage);
    show();
  };

  return { visible, show, showWithMessage, hide, message };
}

export function Toast({
  visible,
  message,
  icon,
  actions,
  position = 'bottom',
  bottomOffset,
  fullWidth,
}: ToastProps) {
  if (!visible) return null;

  const resolvedBottomOffset = bottomOffset ?? POSITION_BOTTOM_OFFSETS[position];

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: resolvedBottomOffset }]}>
      <View
        style={[
          styles.toast,
          fullWidth && styles.toastFullWidth,
          Boolean(actions) && styles.withActions,
        ]}
      >
        <View style={styles.messageGroup}>
          {icon}
          <Text style={styles.message}>{message}</Text>
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing[16],
  },
  toast: {
    maxWidth: 343,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[20],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: 'rgba(43, 47, 56, 0.8)',
    borderRadius: radius[16],
  },
  toastFullWidth: {
    width: '100%',
  },
  withActions: {
    justifyContent: 'space-between',
  },
  messageGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    flexShrink: 1,
  },
  message: {
    ...typography.primary.body3R,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flexShrink: 0,
  },
});
