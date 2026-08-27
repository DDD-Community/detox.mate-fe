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
import { SafeAreaView } from 'react-native-safe-area-context';
import { logError, normalizeError } from '../../api/errors';
import { getGroup } from '../../api/generated/group/group';
import { LoggingButton, LoggingPage } from '../../components';
import { Icon } from '../../components/Icon';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { radius } from '../../lib/token/primitive/radius';
import { spacing } from '../../lib/token/primitive/spacing';
import { typography } from '../../lib/token/primitive/typography';

const LOGO = require('../../../assets/logo-icon-kr.png');

const { brown, gray } = primitiveColors;

export default function GroupHomeScreen() {
  const router = useRouter();
  const [isCheckingGroups, setIsCheckingGroups] = useState(true);

  const routeChooseApp = () => {
    router.push('/(lock)');
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        setIsCheckingGroups(true);
        try {
          const groups = await getGroup().getMyGroups();

          if (cancelled) return;

          const firstGroup = groups[0];
          if (firstGroup) {
            router.replace({
              pathname: '/(feed)/home',
              params: {
                ...(firstGroup.currentChallenge?.id != null
                  ? { groupChallengeId: String(firstGroup.currentChallenge.id) }
                  : {}),
                ...(firstGroup.name ? { groupName: firstGroup.name } : {}),
                ...(firstGroup.inviteCode ? { inviteCode: firstGroup.inviteCode } : {}),
              },
            });
            return;
          }
        } catch (error) {
          if (!cancelled) {
            logError(normalizeError(error), { scope: 'group.home', operation: 'loadMyGroups' });
          }
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

  const handleCreateGroup = () => {
    router.push('/create');
  };

  return (
    <LoggingPage eventName="Group Home Viewed" properties={{ pageName: 'GroupHome' }}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <LoggingButton
              eventName="Group Home Mypage Open Clicked"
              properties={{ pageName: 'GroupHome', buttonName: '마이페이지 아이콘' }}
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
        </SafeAreaView>

        {isCheckingGroups ? (
          <View style={styles.loadingBody}>
            <ActivityIndicator color={gray[400]} />
          </View>
        ) : (
          <View style={styles.content}>
            <TouchableOpacity onPress={routeChooseApp}>
              <Image
                source={require('../../../assets/turtle-fall.png')}
                style={styles.turtle}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={styles.copyFrame}>
              <Text style={styles.title}>아직 그룹이 없어요</Text>
              <Text style={styles.subtitle}>새 그룹을 만들거나 친구가 만든 그룹에 입장해요</Text>
            </View>

            <View style={styles.cardRow}>
              <LoggingButton
                eventName="Group Home Group Create Start Clicked"
                properties={{ pageName: 'GroupHome', buttonName: '새 그룹 만들기' }}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={handleCreateGroup}
                  activeOpacity={0.85}
                >
                  <Image
                    source={require('../../../assets/onboarding-group-plus.png')}
                    style={styles.plusCardIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.cardLabel}>새 그룹 만들기</Text>
                </TouchableOpacity>
              </LoggingButton>
              <LoggingButton
                eventName="Group Home Group Join Start Clicked"
                properties={{ pageName: 'GroupHome', buttonName: '초대 코드 입력' }}
              >
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
              </LoggingButton>
            </View>
          </View>
        )}
      </View>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: 24,
    width: 120,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    top: 77,
    alignSelf: 'center',
    width: 236,
    height: 218,
  },
  copyFrame: {
    position: 'absolute',
    top: 335,
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
    top: 458,
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
