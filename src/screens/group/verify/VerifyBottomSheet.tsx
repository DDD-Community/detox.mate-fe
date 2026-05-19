import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { primitiveColors } from '../../../lib/token/primitive/colors';

const { gray, brown } = primitiveColors;

const SHEET_BOTTOM_PADDING = 20;
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 0.9;
const DISMISS_TRANSLATE_Y = 640;

interface VerifyBottomSheetProps {
  children: ReactNode;
  onDismiss: () => void;
  dismissDisabled?: boolean;
}

export function VerifyBottomSheet({
  children,
  onDismiss,
  dismissDisabled = false,
}: VerifyBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  const dismiss = () => {
    if (dismissDisabled) return;

    Animated.timing(translateY, {
      toValue: DISMISS_TRANSLATE_Y,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (dismissDisabled) return false;
          return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(gestureState.dy, 0));
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldDismiss =
            gestureState.dy >= DISMISS_DISTANCE || gestureState.vy >= DISMISS_VELOCITY;

          if (shouldDismiss) {
            dismiss();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 18,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 18,
          }).start();
        },
      }),
    [dismissDisabled, translateY]
  );

  const handleOverlayPress = () => {
    dismiss();
  };

  const handleSheetPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
  };

  return (
    <Pressable style={styles.overlay} onPress={handleOverlayPress}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + SHEET_BOTTOM_PADDING,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable onPress={handleSheetPress}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>
          {children}
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: brown[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
  },
  grabberWrap: {
    paddingTop: 5,
    paddingBottom: 11,
    alignItems: 'center',
  },
  grabber: {
    width: 52,
    height: 5,
    borderRadius: 100,
    backgroundColor: gray[100],
  },
});
