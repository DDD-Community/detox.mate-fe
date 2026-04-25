import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

export type ChipColorScheme = 'green300' | 'green400' | 'green500';

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  colorScheme?: ChipColorScheme;
  isSelected?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  onClose?: () => void;
}
