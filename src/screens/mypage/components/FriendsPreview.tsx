import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { FriendResponse } from '@/api';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from './ProfileAvatar';

const { gray } = primitiveColors;
const FRIEND_AVATAR_SIZE = 96;

interface FriendsPreviewProps {
  friends: FriendResponse[];
}

export function FriendsPreview({ friends }: FriendsPreviewProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {friends.map((friend) => (
        <View key={friend.friendshipId} style={styles.item}>
          <ProfileAvatar uri={friend.user?.profileImageUrl} size={FRIEND_AVATAR_SIZE} />
          <Text style={styles.name} numberOfLines={1}>
            {friend.user?.displayName ?? '이름 없음'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing[16], gap: spacing[12] },
  item: { width: FRIEND_AVATAR_SIZE, alignItems: 'center', gap: spacing[4] },
  name: { ...typography.primary.body2R, color: gray[900] },
});
