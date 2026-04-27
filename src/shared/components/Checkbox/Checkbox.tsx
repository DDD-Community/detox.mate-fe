import React, { type ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, spacing, typography } from 'src/lib/token';

export interface CheckboxProps extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  checkIcon?: ReactNode;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  checkIcon,
  ...rest
}: CheckboxProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      {...rest}
    >
      <View style={[styles.box, getBoxStyle(checked, disabled)]}>
        {checked && (
          checkIcon ?? (
            <Text style={[styles.checkmark, getCheckmarkStyle(disabled)]}>✓</Text>
          )
        )}
      </View>

      {label && (
        <Text style={[styles.label, getLabelStyle(disabled)]}>{label}</Text>
      )}
    </Pressable>
  );
}

function getBoxStyle(checked: boolean, disabled: boolean): object {
  const { gray } = primitiveColors;
  if (disabled) {
    if (checked) {
      return {
        backgroundColor: gray[100],
        borderWidth: 0,
      };
    }
    return {
      backgroundColor: gray[50],
      borderWidth: 1.5,
      borderColor: gray[100],
    };
  }

  if (checked) {
    return {
      backgroundColor: primitiveColors.green[500],
      borderWidth: 0,
    };
  }

  return {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: gray[200],
  };
}

function getCheckmarkStyle(disabled: boolean): object {
  if (disabled) {
    return { color: primitiveColors.gray[300] };
  }
  return { color: '#FFFFFF' };
}

function getLabelStyle(disabled: boolean): object {
  if (disabled) {
    return { color: primitiveColors.gray[300] };
  }
  return { color: primitiveColors.gray[900] };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[8],
  },
  box: {
    width: 44,
    height: 44,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  label: {
    ...typography.primary.body2M,
  },
});
