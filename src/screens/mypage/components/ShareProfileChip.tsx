import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

const { green } = primitiveColors;
const SHARE_ICON_SIZE = 14;

interface ShareProfileChipProps {
  onPress: () => void;
  pending: boolean;
}

export function ShareProfileChip({ onPress, pending }: ShareProfileChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel="프로필 공유하기"
    >
      {pending ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Icon name="shareFat" size={SHARE_ICON_SIZE} color="#FFFFFF" />
      )}
      <Text style={styles.label}>프로필 공유하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: spacing[40],
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    borderRadius: radius.full,
    backgroundColor: green[300],
  },
  label: { ...typography.primary.body2B, color: '#FFFFFF' },
});
