import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';
import { semanticColors } from '../../lib/token/semantic/colors';

const { brown, gray } = primitiveColors;

export default function GroupHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../../assets/logo-detoxmate-black.png')} />
          <Text style={styles.headerTitle}>디톡스 메이트</Text>
        </View>
        <View style={styles.headerIcons}>
          <Image source={require('../../../assets/onboarding-rg-bell.png')} />
          <View style={{ gap: 50 }} />
          <Image source={require('../../../assets/onboarding-rg-user.png')} />
        </View>
      </View>

      <View style={styles.body}>
        <Image
          source={require('../../../assets/turtle-fall.png')}
          style={styles.turtle}
          resizeMode="contain"
        />
        <Text style={styles.title}>아직 그룹이 없어요</Text>
        <Text style={styles.subtitle}>새 그룹을 만들거나 친구가 만든 그룹에 입장해요</Text>
      </View>

      <View style={styles.cardRow}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/create')}
          activeOpacity={0.85}
        >
          <Image
            source={require('../../../assets/onboarding-group-plus.png')}
            style={styles.cardIcon}
            resizeMode="contain"
          />
          <Text style={styles.cardLabel}>새 그룹 만들기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/join')}
          activeOpacity={0.85}
        >
          <Image
            source={require('../../../assets/onboarding-group-invite.png')}
            style={styles.cardIcon}
            resizeMode="contain"
          />
          <Text style={styles.cardLabel}>초대 코드 입력</Text>
        </TouchableOpacity>
      </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    ...typography.primary.title2B,
    color: semanticColors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: gray[400],
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  turtle: {
    width: 240,
    height: 240,
    marginBottom: 8,
  },
  title: {
    ...typography.primary.title1B,
    color: semanticColors.text.primary,
  },
  subtitle: {
    ...typography.primary.body2R,
    color: semanticColors.text.secondary,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
  },
  cardLabel: {
    ...typography.primary.body2M,
    color: semanticColors.text.primary,
  },
});
