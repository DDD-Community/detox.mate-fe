import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LoggingButton } from '../../components';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { Icon } from '../../components/Icon';

const { gray, brown } = primitiveColors;

interface FeedHeaderProps {
  groupName?: string;
  groupChallengeId?: string | null;
  streakDays?: number;
}

export default function FeedHeader({
  groupName,
  groupChallengeId,
  streakDays = 0,
}: FeedHeaderProps) {
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
        {streakDays > 0 && (
          <View style={styles.streakBadge}>
            <Image
              source={require('../../../assets/reaction-fire.png')}
              style={styles.streakIcon}
            />
            <Text style={styles.streakText}>{streakDays}</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  title: {
    ...typography.accent.title2,
    color: gray[800],
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brown[100],
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  streakIcon: {
    width: 16,
    height: 16,
  },
  streakText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: brown[500],
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
