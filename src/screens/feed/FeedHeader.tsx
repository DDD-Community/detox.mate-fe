import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LoggingButton } from '../../components';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { Icon } from '../../components/Icon';

const { gray } = primitiveColors;

interface FeedHeaderProps {
  groupName?: string;
  groupChallengeId?: string | null;
}

export default function FeedHeader({ groupName, groupChallengeId }: FeedHeaderProps) {
  const handleCalendarPress = () => {
    router.push({
      pathname: '/(feed)/calendar',
      params: { groupChallengeId: groupChallengeId ?? '' },
    });
  };

  return (
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {groupName}
        </Text>
      </View>
      <View style={styles.icons}>
        <LoggingButton
          eventName="Feed Home Notification Open Clicked"
          properties={{ pageName: 'FeedHome', buttonName: '알림 아이콘' }}
        >
          <Pressable
            style={styles.iconButton}
            hitSlop={8}
            onPress={() => router.push('/(group)/notifications')}
          >
            <Icon name="bell" size={24} color={gray[800]} />
          </Pressable>
        </LoggingButton>
        <LoggingButton
          eventName="Feed Home Calendar Open Clicked"
          properties={{ pageName: 'FeedHome', buttonName: '캘린더 아이콘' }}
        >
          <Pressable style={styles.iconButton} hitSlop={8} onPress={handleCalendarPress}>
            <Icon name="calendarBlank" size={24} color={gray[800]} />
          </Pressable>
        </LoggingButton>
        <LoggingButton
          eventName="Feed Home Mypage Open Clicked"
          properties={{ pageName: 'FeedHome', buttonName: '마이페이지 아이콘' }}
        >
          <Pressable
            style={styles.iconButton}
            hitSlop={8}
            onPress={() => router.push('/(group)/mypage')}
          >
            <Icon name="user" size={24} color={gray[800]} />
          </Pressable>
        </LoggingButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 113,
    paddingTop: 59,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[16],
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.accent.title2,
    color: gray[800],
    letterSpacing: -0.4,
  },
  icons: {
    flexDirection: 'row',
    gap: spacing[12],
    flexShrink: 0,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
