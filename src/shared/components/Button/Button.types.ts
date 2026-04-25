import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

export type ButtonVariant = 'filled' | 'outlined' | 'ghost';
export type ButtonColorScheme = 'green300' | 'green400' | 'green500';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: ButtonVariant;
  colorScheme?: ButtonColorScheme;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}
