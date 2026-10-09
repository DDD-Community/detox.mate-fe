import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { FriendResponse } from '@/api';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from './ProfileAvatar';

const { gray } = primitiveColors;
const FRIEND_AVATAR_SIZE = 96;

interface FriendsPreviewProps {
  friends: FriendResponse[];
  // 없으면 항목은 눌러도 동작하지 않는다.
  onPressFriend?: (friend: FriendResponse) => void;
}

export function FriendsPreview({ friends, onPressFriend }: FriendsPreviewProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {friends.map((friend) => (
        <Pressable
          key={friend.friendshipId}
          style={styles.item}
          disabled={!onPressFriend}
          onPress={() => onPressFriend?.(friend)}
          accessibilityRole={onPressFriend ? 'button' : undefined}
        >
          <ProfileAvatar uri={friend.user?.profileImageUrl} size={FRIEND_AVATAR_SIZE} />
          <Text style={styles.name} numberOfLines={1}>
            {friend.user?.displayName ?? '이름 없음'}
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
