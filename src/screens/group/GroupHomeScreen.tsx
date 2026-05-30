import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppLogo } from '@/components';
import { getGroup } from '../../api/generated/group/group';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { radius } from '../../lib/token/primitive/radius';
import { typography } from '../../lib/token/primitive/typography';

const { brown, gray } = primitiveColors;

export default function GroupHomeScreen() {
  const router = useRouter();
  const [isCheckingGroups, setIsCheckingGroups] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        setIsCheckingGroups(true);
        try {
          const groups = await getGroup().getMyGroups();

          if (cancelled) return;

          if ((groups?.length ?? 0) > 0) {
            router.replace('/(feed)/home');
            return;
          }
        } catch {
          // 네트워크 토스트가 표시되므로 이 화면은 빈 그룹 상태로 복구한다.
        } finally {
          if (!cancelled) {
            setIsCheckingGroups(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [router])
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppLogo />
        <View style={styles.headerIcons}>
          <Pressable
            style={styles.iconButton}
            hitSlop={8}
            onPress={() => router.push('/(group)/notifications')}
          >
            <Image
              source={require('../../../assets/onboarding-rg-bell.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            hitSlop={8}
            onPress={() => router.push('/(group)/mypage')}
          >
            <Image
              source={require('../../../assets/onboarding-rg-user.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>

      {isCheckingGroups ? (
        <View style={styles.loadingBody}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.illustration}>
            <Image
              source={require('../../../assets/turtle-fall.png')}
              style={styles.turtle}
              resizeMode="contain"
            />
          </View>
          <View style={styles.copyFrame}>
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
                style={styles.plusCardIcon}
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
                style={styles.inviteCardIcon}
                resizeMode="contain"
              />
              <Text style={styles.cardLabel}>초대 코드 입력</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 113,
    paddingTop: 59,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  loadingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  illustration: {
    alignItems: 'center',
  },
  turtle: {
    width: 236,
    height: 218,
  },
  copyFrame: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
    letterSpacing: -0.28,
    marginTop: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 58,
  },
  card: {
    flex: 1,
    height: 164,
    backgroundColor: brown[50],
    borderRadius: radius[12],
    borderWidth: 1,
    borderColor: gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  plusCardIcon: {
    width: 30,
    height: 29,
  },
  inviteCardIcon: {
    width: 42,
    height: 29,
  },
  cardLabel: {
    ...typography.accent.body1,
    color: gray[500],
    letterSpacing: -0.36,
  },
});
