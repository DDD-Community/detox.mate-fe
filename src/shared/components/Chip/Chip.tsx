import React, { type ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, View } from 'react-native';

import {
  PRIMARY_GREEN_COLOR_MAP,
  primitiveColors,
  radius,
  spacing,
  typography,
  type GreenColorScheme,
} from 'src/lib/token';

export type ChipColorScheme = GreenColorScheme;

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  colorScheme?: ChipColorScheme;
  isSelected?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  onClose?: () => void;
}

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
  const color = PRIMARY_GREEN_COLOR_MAP[colorScheme];

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
  const { gray } = primitiveColors;
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
      borderColor: gray[100],
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
      backgroundColor: gray[50],
      borderWidth: 1,
      borderColor: gray[400],
    };
  }

  return {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: gray[200],
  };
}

function getTextStyle(isSelected: boolean, disabled: boolean, color: string): object {
  if (disabled) {
    if (isSelected) {
      return { color: 'rgba(255,255,255,0.5)' };
    }
    return { color: primitiveColors.gray[300] };
  }
  if (isSelected) {
    return { color: '#FFFFFF' };
  }
  return { color: primitiveColors.gray[900] };
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
