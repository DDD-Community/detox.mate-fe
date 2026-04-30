import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Image, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';
import { semanticColors } from '../../lib/token/semantic/colors';

const { green, gray, brown } = primitiveColors;

export default function FeedScreen() {
  const { groupName, inviteCode } = useLocalSearchParams<{
    groupName?: string;
    inviteCode?: string;
  }>();

  const handleInvite = async () => {
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${inviteCode}`,
    });
  };

  const handleCopy = async () => {
    if (inviteCode) await Clipboard.setStringAsync(inviteCode);
  };

  if (inviteCode) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Image
                source={require('../../../assets/onboarding-rg-bell.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Image
                source={require('../../../assets/onboarding-calendar.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Image
                source={require('../../../assets/onboarding-rg-user.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <Image
            source={require('../../../assets/onboarding-none-feed.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptySubtitle}>
            피드가 없어요{'\n'}친구를 초대하여 함께 디톡스를 시작해 보세요
          </Text>

          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite} activeOpacity={0.85}>
            <Image
              source={require('../../../assets/onboarding-share-white.png')}
              style={styles.shareIcon}
              resizeMode="contain"
            />
            <Text style={styles.inviteText}>친구 초대하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.feedPlaceholder}>피드</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.primary.title2B,
    color: semanticColors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 2,
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
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 15,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.primary.body2R,
    color: semanticColors.text.secondary,
    textAlign: 'center',
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  codeLabel: {
    ...typography.primary.body2R,
    color: semanticColors.text.secondary,
  },
  codeText: {
    ...typography.primary.title1B,
    color: semanticColors.text.primary,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyIcon: {
    width: 20,
    height: 20,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: green[300],
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  shareIcon: {
    width: 18,
    height: 18,
  },
  inviteText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
  feedPlaceholder: {
    ...typography.primary.title1B,
    color: semanticColors.text.primary,
  },
});
