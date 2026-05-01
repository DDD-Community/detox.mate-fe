import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { gray, green } = primitiveColors;
const WHITE = '#FFFFFF';

export type ChipVariant = 'solid' | 'outline';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  active?: boolean;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

interface ChipColors {
  bg: string;
  border: string;
  text: string;
}

interface ChipSizes {
  height: number;
  paddingHorizontal: number;
  iconSize: number;
  trailingIconSize: number;
  textStyle: typeof typography.primary.body2R;
}

const getChipColors = ({
  variant,
  active,
  disabled,
  pressed,
}: {
  variant: ChipVariant;
  active: boolean;
  disabled: boolean;
  pressed: boolean;
}): ChipColors => {
  if (variant === 'solid') {
    if (disabled && active) return { bg: green[50], border: 'transparent', text: green[300] };
    if (disabled) return { bg: gray[50], border: 'transparent', text: gray[300] };
    if (active) return { bg: green[300], border: 'transparent', text: WHITE };
    if (pressed) return { bg: gray[100], border: 'transparent', text: gray[800] };
    return { bg: gray[50], border: 'transparent', text: gray[800] };
  }

  if (disabled && active) return { bg: WHITE, border: green[50], text: green[300] };
  if (disabled) return { bg: WHITE, border: gray[100], text: gray[300] };
  if (active) return { bg: green[400], border: green[400], text: WHITE };
  if (pressed) return { bg: gray[50], border: gray[200], text: gray[800] };
  return { bg: WHITE, border: gray[200], text: gray[800] };
};

const getChipSizes = (size: ChipSize): ChipSizes => {
  switch (size) {
    case 'sm':
      return {
        height: 24,
        paddingHorizontal: spacing[8],
        iconSize: 12,
        trailingIconSize: 12,
        textStyle: typography.primary.body3R,
      };
    case 'lg':
      return {
        height: 40,
        paddingHorizontal: spacing[16],
        iconSize: 16,
        trailingIconSize: 14,
        textStyle: typography.primary.body2R,
      };
    case 'md':
    default:
      return {
        height: 36,
        paddingHorizontal: spacing[12],
        iconSize: 14,
        trailingIconSize: 12,
        textStyle: typography.primary.body2R,
      };
  }
};

export function Chip({
  label,
  variant = 'solid',
  size = 'md',
  active = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  onPress,
  style,
}: ChipProps) {
  const sizes = getChipSizes(size);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
    >
      {({ pressed }) => {
        const colors = getChipColors({ variant, active, disabled, pressed });
        return (
          <View
            style={[
              styles.container,
              {
                height: sizes.height,
                paddingHorizontal: sizes.paddingHorizontal,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: variant === 'outline' ? 1 : 0,
              },
              style,
            ]}
          >
            {leadingIcon ? (
              <View style={{ width: sizes.iconSize, height: sizes.iconSize }}>{leadingIcon}</View>
            ) : null}
            <Text style={[sizes.textStyle, { color: colors.text }]} numberOfLines={1}>
              {label}
            </Text>
            {trailingIcon ? (
              <View
                style={{ width: sizes.trailingIconSize, height: sizes.trailingIconSize }}
              >
                {trailingIcon}
              </View>
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
});
