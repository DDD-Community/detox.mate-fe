import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, semanticColors, spacing, typography } from 'src/lib/token';

import type { ChipColorScheme, ChipProps } from './Chip.types';

const COLOR_MAP: Record<ChipColorScheme, string> = {
  green300: primitiveColors.green[300],
  green400: primitiveColors.green[400],
  green500: primitiveColors.green[500],
};

export function Chip({
  label,
  colorScheme = 'green500',
  isSelected = false,
  disabled = false,
  leftIcon,
  onClose,
  onPress,
  ...rest
}: ChipProps) {
  const color = COLOR_MAP[colorScheme];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        getContainerStyle(isSelected, disabled, color, pressed),
      ]}
      disabled={disabled}
      onPress={onPress}
      {...rest}
    >
      {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

      <Text style={[styles.label, getTextStyle(isSelected, disabled, color)]}>{label}</Text>

      {onClose && (
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          disabled={disabled}
          hitSlop={4}
        >
          <Text style={[styles.closeIcon, getTextStyle(isSelected, disabled, color)]}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function getContainerStyle(
  isSelected: boolean,
  disabled: boolean,
  color: string,
  pressed: boolean,
): object {
  if (disabled) {
    if (isSelected) {
      return {
        backgroundColor: primitiveColors.green[400] + '4D',
        borderWidth: 0,
      };
    }
    return {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: semanticColors.border.secondary,
    };
  }

  if (isSelected) {
    return {
      backgroundColor: pressed ? color + 'D9' : color,
      borderWidth: 0,
    };
  }

  if (pressed) {
    return {
      backgroundColor: primitiveColors.gray[50],
      borderWidth: 1,
      borderColor: semanticColors.border.strong,
    };
  }

  return {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: semanticColors.border.primary,
  };
}

function getTextStyle(isSelected: boolean, disabled: boolean, color: string): object {
  if (disabled) {
    if (isSelected) {
      return { color: 'rgba(255,255,255,0.5)' };
    }
    return { color: semanticColors.text.disabled };
  }
  if (isSelected) {
    return { color: '#FFFFFF' };
  }
  return { color: semanticColors.text.primary };
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: spacing[12],
    borderRadius: radius.full,
    gap: spacing[4],
  },
  label: {
    ...typography.primary.body2M,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    minHeight: 20,
  },
  closeIcon: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
  },
});
