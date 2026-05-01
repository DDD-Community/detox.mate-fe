import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { gray, green } = primitiveColors;

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  checkIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface BoxColors {
  bg: string;
  border: string;
  showCheck: boolean;
}

const getBoxColors = (checked: boolean, disabled: boolean): BoxColors => {
  if (disabled && checked)
    return { bg: gray[50], border: gray[100], showCheck: true };
  if (disabled) return { bg: gray[50], border: gray[100], showCheck: false };
  if (checked) return { bg: green[400], border: green[400], showCheck: true };
  return { bg: '#FFFFFF', border: gray[100], showCheck: false };
};

const getLabelColor = (disabled: boolean) => (disabled ? gray[200] : gray[800]);

const getCheckColor = (disabled: boolean) => (disabled ? gray[200] : '#FFFFFF');

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  checkIcon,
  style,
}: CheckboxProps) {
  const box = getBoxColors(checked, disabled);

  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={[styles.container, style]}
    >
      <View style={[styles.box, { backgroundColor: box.bg, borderColor: box.border }]}>
        {box.showCheck
          ? checkIcon ?? (
              <Text style={[styles.check, { color: getCheckColor(disabled) }]}>✓</Text>
            )
          : null}
      </View>
      {label ? (
        <Text style={[styles.label, { color: getLabelColor(disabled) }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[8],
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius[8],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
  },
  label: {
    ...typography.accent.title2,
  },
});
