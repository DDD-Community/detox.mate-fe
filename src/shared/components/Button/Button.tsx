import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, spacing, typography } from 'src/lib/token';

import type { ButtonColorScheme, ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

const COLOR_MAP: Record<ButtonColorScheme, string> = {
  green300: primitiveColors.green[300],
  green400: primitiveColors.green[400],
  green500: primitiveColors.green[500],
};

const SIZE_CONFIG: Record<
  ButtonSize,
  {
    width: number;
    height: number;
    paddingH: number;
    iconSize: number;
    iconOnlySize: number;
  }
> = {
  sm: { width: 80, height: 36, paddingH: spacing[12], iconSize: 16, iconOnlySize: 36 },
  md: { width: 109, height: 44, paddingH: spacing[16], iconSize: 18, iconOnlySize: 44 },
  lg: { width: 148, height: 52, paddingH: spacing[20], iconSize: 20, iconOnlySize: 52 },
};

export function Button({
  variant = 'filled',
  colorScheme = 'green500',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  disabled = false,
  fullWidth = false,
  onPress,
  ...rest
}: ButtonProps) {
  const color = COLOR_MAP[colorScheme];
  const sizeConfig = SIZE_CONFIG[size];
  const isIconOnly = !children;

  const containerStyle = [
    styles.base,
    isIconOnly
      ? {
          width: sizeConfig.iconOnlySize,
          height: sizeConfig.iconOnlySize,
          borderRadius: radius.full,
          paddingHorizontal: 0,
        }
      : {
          width: fullWidth ? undefined : sizeConfig.width,
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingH,
          borderRadius: radius.full,
          flex: fullWidth ? 1 : undefined,
        },
    getContainerStyle(variant, color, disabled),
  ];

  const textStyle = [styles.label, getTextStyle(variant, color, disabled)];

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !disabled && getPressedOverlay(variant, color),
      ]}
      disabled={disabled}
      onPress={onPress}
      {...rest}
    >
      {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}
      {children ? <Text style={textStyle}>{children}</Text> : null}
      {rightIcon && <View style={styles.iconSlot}>{rightIcon}</View>}
    </Pressable>
  );
}

function getContainerStyle(
  variant: ButtonVariant,
  color: string,
  disabled: boolean,
): object {
  if (disabled) {
    if (variant === 'filled') {
      return {
        backgroundColor: primitiveColors.green[400] + '4D',
        borderWidth: 0,
      };
    }
    if (variant === 'outlined') {
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: primitiveColors.gray[200],
      };
    }
    return { backgroundColor: 'transparent', borderWidth: 0 };
  }

  if (variant === 'filled') {
    return { backgroundColor: color, borderWidth: 0 };
  }
  if (variant === 'outlined') {
    return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color };
  }
  return { backgroundColor: 'transparent', borderWidth: 0 };
}

function getTextStyle(variant: ButtonVariant, color: string, disabled: boolean): object {
  if (disabled) {
    if (variant === 'filled') {
      return { color: 'rgba(255,255,255,0.5)' };
    }
    return { color: primitiveColors.gray[300] };
  }
  if (variant === 'filled') {
    return { color: '#FFFFFF' };
  }
  return { color };
}

function getPressedOverlay(variant: ButtonVariant, color: string): object {
  if (variant === 'filled') {
    return { opacity: 0.85 };
  }
  if (variant === 'outlined' || variant === 'ghost') {
    return { backgroundColor: color + '14' };
  }
  return {};
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
  },
  label: {
    ...typography.primary.body2M,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
