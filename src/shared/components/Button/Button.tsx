import React, { type ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, spacing, typography } from 'src/lib/token';

export type ButtonVariant = 'solid' | 'outlined' | 'text';
export type ButtonColor = 'primary' | 'assistive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonIconOption = 'icon' | 'iconOnly' | 'iconOnlyCircle';
export type ButtonState = 'normal' | 'hover' | 'press' | 'disabled';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  iconOption?: ButtonIconOption;
  state?: ButtonState;
  icon?: ReactNode;
  children?: string;
  fullWidth?: boolean;
}

const { green, gray, brown } = primitiveColors;

function alpha(hex: string, pct: number): string {
  return hex + Math.round((pct / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
}

type StateStyle = {
  bg: string;
  text: string;
  border?: { color: string; width: number };
};

const ROW_COLORS: Record<`${ButtonVariant}-${ButtonColor}`, Record<ButtonState, StateStyle>> = {
  'solid-primary': {
    normal:   { bg: green[300], text: '#FFFFFF' },
    hover:    { bg: green[400], text: '#FFFFFF' },
    press:    { bg: green[500], text: '#FFFFFF' },
    disabled: { bg: alpha(green[400], 30), text: '#FFFFFF' },
  },
  'outlined-primary': {
    normal:   { bg: green[50],  text: green[300], border: { color: gray[100], width: 1 } },
    hover:    { bg: green[50],  text: green[300], border: { color: gray[100], width: 1 } },
    press:    { bg: green[75],  text: green[300], border: { color: gray[100], width: 1 } },
    disabled: { bg: green[50],  text: alpha(green[300], 30), border: { color: gray[100], width: 1 } },
  },
  'solid-assistive': {
    normal:   { bg: brown[900], text: '#FFFFFF' },
    hover:    { bg: brown[900], text: '#FFFFFF' },
    press:    { bg: brown[900], text: '#FFFFFF' },
    disabled: { bg: alpha(brown[900], 30), text: '#FFFFFF' },
  },
  'outlined-assistive': {
    normal:   { bg: gray[50],  text: gray[800] },
    hover:    { bg: gray[50],  text: gray[800] },
    press:    { bg: gray[100], text: gray[800] },
    disabled: { bg: alpha(gray[50], 30), text: gray[800] },
  },
  'text-primary': {
    normal:   { bg: 'transparent', text: green[300] },
    hover:    { bg: green[50],     text: green[300] },
    press:    { bg: green[75],     text: green[300] },
    disabled: { bg: 'transparent', text: alpha(green[300], 30) },
  },
  'text-assistive': {
    normal:   { bg: 'transparent', text: gray[800] },
    hover:    { bg: gray[50],      text: gray[800] },
    press:    { bg: gray[100],     text: gray[800] },
    disabled: { bg: 'transparent', text: alpha(gray[800], 30) },
  },
};

const SIZE_CONFIG: Record<
  ButtonSize,
  { width: number; height: number; paddingH: number; iconOnlySize: number }
> = {
  sm: { width: 109, height: 44, paddingH: spacing[16], iconOnlySize: 44 },
  md: { width: 123, height: 50, paddingH: spacing[20], iconOnlySize: 50 },
  lg: { width: 123, height: 56, paddingH: spacing[20], iconOnlySize: 56 },
};

const BUTTON_ICON_SIZE = 16;

function resolveState(state: ButtonState, isDisabled: boolean, pressed: boolean): ButtonState {
  if (isDisabled) return 'disabled';
  if (pressed || state === 'press') return 'press';
  if (state === 'hover') return 'hover';
  return 'normal';
}

export function Button({
  variant = 'solid',
  color = 'primary',
  size = 'md',
  iconOption = 'icon',
  state = 'normal',
  icon,
  children,
  fullWidth = false,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = state === 'disabled';
  const isIconOnly = iconOption === 'iconOnly' || iconOption === 'iconOnlyCircle';
  const rowKey = `${variant}-${color}` as `${ButtonVariant}-${ButtonColor}`;
  const sizeConfig = SIZE_CONFIG[size];

  const shapeStyle = isIconOnly
    ? {
        width: sizeConfig.iconOnlySize,
        height: sizeConfig.iconOnlySize,
        borderRadius: iconOption === 'iconOnlyCircle' ? radius.full : 18,
        paddingHorizontal: 0,
      }
    : {
        width: fullWidth ? undefined : sizeConfig.width,
        height: sizeConfig.height,
        paddingHorizontal: sizeConfig.paddingH,
        borderRadius: 18,
        flex: fullWidth ? 1 : undefined,
      };

  return (
    <Pressable
      style={({ pressed }) => {
        const { bg, border } = ROW_COLORS[rowKey][resolveState(state, isDisabled, pressed)];
        return [
          styles.base,
          shapeStyle,
          {
            backgroundColor: bg,
            borderWidth: border?.width ?? 0,
            borderColor: border?.color,
          },
        ];
      }}
      disabled={isDisabled}
      onPress={onPress}
      {...rest}
    >
      {({ pressed }) => {
        const { text } = ROW_COLORS[rowKey][resolveState(state, isDisabled, pressed)];
        return (
          <>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
            {!isIconOnly && children ? (
              <Text style={[styles.label, { color: text }]}>{children}</Text>
            ) : null}
          </>
        );
      }}
    </Pressable>
  );
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
    width: BUTTON_ICON_SIZE,
    height: BUTTON_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
