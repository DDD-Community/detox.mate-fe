import { useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/client';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';
import { semanticColors } from '../../lib/token/semantic/colors';

const { brown, gray } = primitiveColors;

export default function GroupHomeScreen() {
  const router = useRouter();

  const handleGetMe = async () => {
    try {
      const res = await apiClient.get('/users/me');
      console.log('users/me:', JSON.stringify(res.data));
      Alert.alert('users/me', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      console.log('users/me error:', e?.response);
      Alert.alert('실패', `${e?.response?.status}: ${e?.response?.data?.message}`);
    }
  };

  const handleGetMyGroups = async () => {
    try {
      const res = await apiClient.get('/me/groups');
      console.log('me/groups:', JSON.stringify(res.data));
      Alert.alert('me/groups', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      console.log('me/groups error:', e?.response);
      Alert.alert('실패', `${e?.response?.status}: ${e?.response?.data?.message}`);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const res = await apiClient.delete('/groups/10');
      console.log('delete res:', res);
      Alert.alert('성공', '그룹이 삭제됐어요');
    } catch (e: any) {
      console.log('delete error:', e?.response);
      Alert.alert('실패', `${e?.response?.status}: ${e?.response?.data?.message}`);
    }
  };

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

      <TouchableOpacity style={styles.debugButton} onPress={handleGetMe} activeOpacity={0.8}>
        <Text style={styles.debugText}>[임시] GET /users/me</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.debugButton} onPress={handleGetMyGroups} activeOpacity={0.8}>
        <Text style={styles.debugText}>[임시] GET /me/groups</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.debugButton} onPress={handleDeleteGroup} activeOpacity={0.8}>
        <Text style={styles.debugText}>[임시] 참여된 그룹 삭제</Text>
      </TouchableOpacity>

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
  debugButton: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  debugText: {
    ...typography.primary.body2M,
    color: '#FFFFFF',
  },
});
