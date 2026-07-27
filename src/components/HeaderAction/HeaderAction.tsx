import type { IconWeight } from 'phosphor-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { primitiveColors, spacing, typography } from '../../lib/token';
import type { IconName } from '../../lib/token/icons';
import { Icon } from '../Icon';

const { gray } = primitiveColors;

interface HeaderActionProps {
  label: string;
  onPress: () => void;
  iconName?: IconName;
  iconSize?: number;
  iconColor?: string;
  iconWeight?: IconWeight;
  hitSlop?: number;
  accessibilityLabel?: string;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function HeaderAction({
  label,
  onPress,
  iconName = 'caretLeft',
  iconSize = 24,
  iconColor = gray[800],
  iconWeight = 'regular',
  hitSlop = 8,
  accessibilityLabel,
  numberOfLines = 1,
  style,
  textStyle,
}: HeaderActionProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={[styles.root, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Icon name={iconName} size={iconSize} color={iconColor} weight={iconWeight} />
      <Text style={[styles.label, textStyle]} numberOfLines={numberOfLines}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  label: {
    ...typography.accent.title2,
    color: gray[800],
    flexShrink: 1,
  },
});
