import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { typography } from '../lib/token/primitive/typography';

type ToastType = 'sessionExpired' | 'loginFailed';

interface Props {
  type: ToastType;
  visible: boolean;
  onHide: () => void;
}

const TOAST_CONFIG: Record<ToastType, { message: string; icon: 'info' | 'warning' }> = {
  sessionExpired: {
    message: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요',
    icon: 'info',
  },
  loginFailed: {
    message: '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
    icon: 'warning',
  },
};

export default function LoginToast({ type, visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [visible]);

  if (!visible) return null;

  const { message, icon } = TOAST_CONFIG[type];

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {icon === 'info' ? (
        <Image
          source={require('../../assets/onboarding-info.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.warningIcon}>
          <Text style={styles.warningIconText}>!</Text>
        </View>
      )}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#595959',
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    maxWidth: '88%',
  },
  icon: {
    width: 18,
    height: 18,
  },
  warningIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'NanumSquareRoundEB',
    lineHeight: 14,
    includeFontPadding: false,
  },
  message: {
    ...typography.primary.body2R,
    color: '#FFFFFF',
    flexShrink: 1,
  },
});
