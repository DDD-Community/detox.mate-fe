import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      {isCheckingGroups ? (
        <View style={styles.loadingBody}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : (
        <View style={styles.content}>
          <Image
            source={require('../../../assets/turtle-fall.png')}
            style={styles.turtle}
            resizeMode="contain"
          />
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
  loadingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  turtle: {
    position: 'absolute',
    top: 177,
    alignSelf: 'center',
    width: 236,
    height: 218,
  },
  copyFrame: {
    position: 'absolute',
    top: 435,
    left: 0,
    right: 0,
    alignItems: 'center',
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
    position: 'absolute',
    top: 558,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
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
