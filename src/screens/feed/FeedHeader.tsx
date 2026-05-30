import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors, spacing, typography } from '../../lib/token';

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
      <Text style={styles.title}>{groupName}</Text>
      <View style={styles.icons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/(group)/notifications')}
        >
          <Image
            source={require('../../../assets/onboarding-rg-bell.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleCalendarPress}>
          <Image
            source={require('../../../assets/onboarding-calendar.png')}
            style={[styles.icon, styles.calendarIcon]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(group)/mypage')}>
          <Image
            source={require('../../../assets/onboarding-rg-user.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
  },
  title: {
    ...typography.accent.title2,
    color: gray[800],
  },
  icons: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  calendarIcon: {
    opacity: 0.3,
  },
});
