import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import type { FriendPageRelationship } from '../utils/friendPageParams';

const { green } = primitiveColors;

const LABELS: Record<FriendPageRelationship, string> = {
  FRIEND: '친구',
  NONE: '요청 보내기',
  PENDING_SENT: '요청됨',
  PENDING_RECEIVED: '친구 수락',
};

interface FriendStatusButtonProps {
  relationship: FriendPageRelationship;
  pending: boolean;
  onPress: () => void;
}

export function FriendStatusButton({ relationship, pending, onPress }: FriendStatusButtonProps) {
  // 보낸 요청은 취소할 수 없으므로 '요청됨'은 눌러도 동작하지 않는 비활성 상태다.
  const disabled = relationship === 'PENDING_SENT' || pending;
  const requested = relationship === 'PENDING_SENT';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: pending }}
      style={[styles.chip, requested && styles.requested]}
    >
      {pending ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{LABELS[relationship]}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: spacing[68],
    height: spacing[36],
    paddingHorizontal: spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: green[300],
  },
  requested: { backgroundColor: green[75] },
  label: { ...typography.primary.body2M, color: '#FFFFFF' },
});
