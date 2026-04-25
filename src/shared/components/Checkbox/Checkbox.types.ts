import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

export interface CheckboxProps extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  checkIcon?: ReactNode;
}
