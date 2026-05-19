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
            style={styles.icon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/(group)/mypage')}
        >
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
    paddingTop: spacing[64],
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.primary.title2B,
    color: gray[900],
  },
  icons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
