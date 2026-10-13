import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { primitiveColors, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from './ProfileAvatar';

const { gray } = primitiveColors;
const FRIEND_AVATAR_SIZE = 96;

export interface FriendsPreviewItem {
  key: string;
  displayName: string;
  profileImageUrl?: string | null;
}

interface FriendsPreviewProps {
  items: FriendsPreviewItem[];
  // 없으면 항목은 눌러도 동작하지 않는다.
  onPressItem?: (key: string) => void;
}

export function FriendsPreview({ items, onPressItem }: FriendsPreviewProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={styles.item}
          disabled={!onPressItem}
          onPress={() => onPressItem?.(item.key)}
          accessibilityRole={onPressItem ? 'button' : undefined}
        >
          <ProfileAvatar uri={item.profileImageUrl} size={FRIEND_AVATAR_SIZE} />
          <Text style={styles.name} numberOfLines={1}>
            {item.displayName}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing[16], gap: spacing[12] },
  item: { width: FRIEND_AVATAR_SIZE, alignItems: 'center', gap: spacing[4] },
  name: { ...typography.primary.body2R, color: gray[900] },
});
