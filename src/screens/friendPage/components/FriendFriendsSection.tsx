import { StyleSheet, Text, View } from 'react-native';

import type { FriendResponse } from '@/api';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { FriendsPreview } from '@/screens/mypage/components/FriendsPreview';

const { gray } = primitiveColors;

interface FriendFriendsSectionProps {
  friends: FriendResponse[];
}

export function FriendFriendsSection({ friends }: FriendFriendsSectionProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>친구 목록</Text>
      {friends.length > 0 ? (
        // 이 목록의 항목은 눌러도 동작하지 않는다(시안).
        <FriendsPreview friends={friends} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 친구가 없어요</Text>
          <Text style={styles.emptyDescription}>
            {'친구 요청을 보내\n함께 디지털 디톡스 시작해보세요!'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: spacing[24], gap: spacing[12] },
  title: { ...typography.primary.title1B, marginHorizontal: spacing[16], color: gray[900] },
  empty: { alignItems: 'center', paddingTop: spacing[32], gap: spacing[4] },
  emptyTitle: { ...typography.primary.body1R, color: gray[900] },
  emptyDescription: { ...typography.primary.body2R, textAlign: 'center', color: gray[300] },
});
