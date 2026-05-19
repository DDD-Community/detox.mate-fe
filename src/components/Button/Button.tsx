import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { primitiveColors, spacing, typography } from '../../lib/token';

const { gray, green, brown } = primitiveColors;
const WHITE = '#FFFFFF';
const BUTTON_RADIUS = 18;

export type ButtonVariant = 'solid' | 'outlined' | 'text';
export type ButtonColor = 'primary' | 'assistive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonIconOption = false | true | 'circle';

export interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  iconOnly?: ButtonIconOption;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

interface ButtonColors {
  bg: string;
  border: string;
  fg: string;
  opacity?: number;
}

interface ButtonSizes {
  height: number;
  paddingHorizontal: number;
  minWidth: number;
  iconSize: number;
  textStyle: typeof typography.primary.body1B;
}

const getColorBase = (color: ButtonColor) =>
  color === 'primary'
    ? { normal: green[300], press: green[500], disabledBg: green[400] }
    : { normal: brown[900], press: brown[600], disabledBg: brown[900] };

const getColors = ({
  variant,
  color,
  disabled,
  pressed,
}: {
  variant: ButtonVariant;
  color: ButtonColor;
  disabled: boolean;
  pressed: boolean;
}): ButtonColors => {
  const palette = getColorBase(color);
  const accent = color === 'primary' ? green : brown;
  const subtleBg = color === 'primary' ? green[50] : brown[50];

  if (variant === 'solid') {
    if (disabled) return { bg: palette.disabledBg, border: 'transparent', fg: WHITE, opacity: 0.3 };
    if (pressed) return { bg: palette.press, border: 'transparent', fg: WHITE };
    return { bg: palette.normal, border: 'transparent', fg: WHITE };
  }

  if (variant === 'outlined') {
    if (disabled) return { bg: subtleBg, border: 'transparent', fg: palette.normal, opacity: 0.4 };
    if (pressed)
      return {
        bg: color === 'primary' ? accent[100] : brown[100],
        border: 'transparent',
        fg: palette.press,
      };
    return { bg: subtleBg, border: 'transparent', fg: palette.normal };
  }

  if (disabled) return { bg: 'transparent', border: 'transparent', fg: gray[300] };
  if (pressed) return { bg: 'transparent', border: 'transparent', fg: palette.press };
  return { bg: 'transparent', border: 'transparent', fg: palette.normal };
};

const getSizes = (size: ButtonSize): ButtonSizes => {
  switch (size) {
    case 'sm':
      return {
        height: 44,
        paddingHorizontal: spacing[12],
        minWidth: 80,
        iconSize: 16,
        textStyle: typography.primary.body2B,
      };
    case 'lg':
      return {
        height: 56,
        paddingHorizontal: spacing[16],
        minWidth: 88,
        iconSize: 20,
        textStyle: typography.primary.body1B,
      };
    case 'md':
    default:
      return {
        height: 50,
        paddingHorizontal: spacing[16],
        minWidth: 88,
        iconSize: 20,
        textStyle: typography.primary.body1B,
      };
  }
};

export function Button({
  label,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  iconOnly = false,
  leadingIcon,
  trailingIcon,
  disabled = false,
  onPress,
  style,
}: ButtonProps) {
  const sizes = getSizes(size);
  const isIconOnly = iconOnly !== false;
  const radius = iconOnly === 'circle' ? 999 : BUTTON_RADIUS;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      style={style}
    >
      {({ pressed }) => {
        const colors = getColors({ variant, color, disabled, pressed });
        return (
          <View
            style={[
              styles.container,
              {
                height: sizes.height,
                minHeight: sizes.height,
                minWidth: isIconOnly ? sizes.height : sizes.minWidth,
                paddingHorizontal: isIconOnly ? 0 : sizes.paddingHorizontal,
                width: isIconOnly ? sizes.height : undefined,
                backgroundColor: colors.bg,
                borderRadius: radius,
                opacity: colors.opacity ?? 1,
              },
              style,
            ]}
          >
            {leadingIcon ? (
              <View style={{ width: sizes.iconSize, height: sizes.iconSize }}>{leadingIcon}</View>
            ) : null}
            {!isIconOnly && label ? (
              <Text style={[sizes.textStyle, { color: colors.fg }]} numberOfLines={1}>
                {label}
              </Text>
            ) : null}
            {trailingIcon ? (
              <View style={{ width: sizes.iconSize, height: sizes.iconSize }}>{trailingIcon}</View>
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    alignSelf: 'flex-start',
  },
});
