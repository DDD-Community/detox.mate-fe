import { Pressable, Text, View } from 'react-native';

import { getUserErrorMessage, normalizeError } from '../../../api/errors';
import { fontFamily } from '../../../lib/token/primitive/fonts';

export function FriendsErrorFeedback({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View
      style={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
      accessibilityLiveRegion="polite"
    >
      <Text style={{ color: '#9d4e4e', fontFamily: fontFamily.primary.regular }}>
        {getUserErrorMessage(normalizeError(error))}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry}>
        <Text style={{ color: '#5a8974', fontFamily: fontFamily.primary.bold }}>다시 시도</Text>
      </Pressable>
    </View>
  );
}
