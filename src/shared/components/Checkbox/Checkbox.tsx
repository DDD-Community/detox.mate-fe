import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors, radius, semanticColors, spacing, typography } from 'src/lib/token';

import type { CheckboxProps } from './Checkbox.types';

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
  if (disabled) {
    if (checked) {
      return {
        backgroundColor: semanticColors.bg.tertiary,
        borderWidth: 0,
      };
    }
    return {
      backgroundColor: semanticColors.bg.secondary,
      borderWidth: 1.5,
      borderColor: semanticColors.border.secondary,
    };
  }

  if (checked) {
    return {
      backgroundColor: primitiveColors.green[500],
      borderWidth: 0,
    };
  }

  return {
    backgroundColor: semanticColors.bg.primary,
    borderWidth: 1.5,
    borderColor: semanticColors.border.primary,
  };
}

function getCheckmarkStyle(disabled: boolean): object {
  if (disabled) {
    return { color: semanticColors.text.disabled };
  }
  return { color: '#FFFFFF' };
}

function getLabelStyle(disabled: boolean): object {
  if (disabled) {
    return { color: semanticColors.text.disabled };
  }
  return { color: semanticColors.text.primary };
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
