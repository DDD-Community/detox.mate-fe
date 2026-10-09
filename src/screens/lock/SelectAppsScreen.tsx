import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { differenceTokens, tokensOverlap, unionTokens } from '../../lib/familyActivitySelections';
import { lockApp, releaseAppLock } from '../../lib/lockRegistration';
import { findDeselectedAppIds } from '../../lib/lockSelectionDiff';
import { SHIELD_ACTIONS, SHIELD_CONFIGURATION } from '../../lib/shieldConfig';
import { splitSelection } from '../../../modules/screen-time-report';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray, green } = primitiveColors;

const DARK_BG = '#0B0B0C';
// 피커가 뜨면서 초기 상태로 들어오는 빈 선택 이벤트를 걸러내는 시간.
const EMPTY_EVENT_GRACE_MS = 1000;

/**
 * 실제 iOS 앱 선택 화면(FamilyActivityPicker)을 화면 안에 끼워 넣고, 위쪽 제목/완료 버튼은
 * 우리가 직접 그린다(시트로 띄우면 상단을 꾸밀 수 없다). 앱 이름/아이콘은
 * 토큰만으로는 절대 읽을 수 없어서(애플 정책), 화면 표시용 이름은 "잠긴 앱 N"으로
 * 자동으로 붙인다 — 실제 이름/아이콘이 필요한 곳(리포트 화면)은 ScreenTimeReportView가
 * Label(token)로 따로 보여준다.
 *
 * 각 등록 그룹(잠긴 앱 N)은 여전히 각자의 토큰을 따로 들고 있어서(개별 해제/타이머를
 * 위해 필요) — 다만 피커를 "다시 열 때"는 지금까지 등록된 전체를 하나로 합친
 * 토큰(union)을 미리 체크된 상태로 보여주고, 닫을 때 차집합으로 새로 추가된 것만 새
 * 그룹으로 등록하되, 한 번에 여러 앱을 골랐으면 앱별로 쪼개서 각각 등록한다. 체크를 해제한
 * 기존 앱은 등록 해제한다.
 */
export default function SelectAppsScreen() {
  const router = useRouter();
  const { selectedAppIds, familyActivitySelectionsByAppId, registerAppSelection, unregisterApp } =
    useLockStore();
  const isDark = useColorScheme() !== 'light';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [initialUnionToken] = useState(() =>
    unionTokens(Object.values(familyActivitySelectionsByAppId))
  );
  const [pendingToken, setPendingToken] = useState<string | null>(initialUnionToken);
  // 가장 최근 선택(null = 아무것도 선택 안 함). 상태(pendingToken)는 재렌더가 끝나야 반영돼서
  // "완료"를 누른 시점의 상태가 한 박자 늦을 수 있다 — ref는 이벤트 즉시 갱신된다.
  const latestTokenRef = useRef<string | null>(initialUnionToken);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    const openPicker = async () => {
      if (
        ReactNativeDeviceActivity.getAuthorizationStatus() !==
        ReactNativeDeviceActivity.AuthorizationStatus.approved
      ) {
        try {
          await ReactNativeDeviceActivity.requestAuthorization('individual');
        } catch {
          router.back();
          return;
        }
      }
      setIsAuthorized(true);
    };

    openPicker();
  }, [router]);

  const latestCountRef = useRef(0);

  const handleSelectionChange = (event: {
    familyActivitySelection: string | null;
    applicationCount: number;
    categoryCount: number;
    webDomainCount: number;
  }) => {
    const { familyActivitySelection: token } = event;
    // 개수는 네이티브 메타데이터를 다시 호출하지 않고 이벤트가 직접 주는 값을 쓴다.
    const count = event.applicationCount + event.categoryCount + event.webDomainCount;
    if (token && count > 0) {
      latestTokenRef.current = token;
      latestCountRef.current = count;
    } else if (Date.now() - mountedAtRef.current > EMPTY_EVENT_GRACE_MS) {
      // 피커가 막 뜰 때 들어오는 초기 빈 이벤트는 무시하고, 그 뒤의 빈 선택은 "전부 해제"로 본다.
      latestTokenRef.current = null;
      latestCountRef.current = 0;
    }
    setPendingToken(token);
  };

  // 시트가 아니라 화면 안에 끼운 피커라서 닫힘 이벤트/애니메이션을 기다리지 않고, "완료"를 누른
  // 시점의 마지막 선택(ref)을 바로 처리한다.
  const handleDone = () => {
    const newToken = latestTokenRef.current;
    // [임시 디버그] 앱 선택이 반영되지 않는 원인 확인용 — 원인 확인 후 제거.
    console.log('[select-apps-debug] done', {
      hasToken: !!newToken,
      count: latestCountRef.current,
      hasInitial: !!initialUnionToken,
    });

    // 체크를 해제한 기존 앱은 등록 해제한다(차단 해제 + 앱별 쉴드 제거 + 목록에서 제거).
    const deselectedAppIds = findDeselectedAppIds(
      familyActivitySelectionsByAppId,
      newToken,
      tokensOverlap
    );
    deselectedAppIds.forEach((deselectedAppId) => {
      releaseAppLock(deselectedAppId, familyActivitySelectionsByAppId[deselectedAppId]);
      unregisterApp(deselectedAppId);
    });

    // 선택이 비었으면 새로 추가할 게 없다.
    if (!newToken) {
      router.back();
      return;
    }

    // 새로 추가된 부분(이전엔 없었는데 이번에 체크된 것)만 새 그룹으로 등록한다.
    const addedToken = initialUnionToken ? differenceTokens(newToken, initialUnionToken) : newToken;

    if (!addedToken) {
      router.back();
      return;
    }

    // 한 번에 여러 앱을 골랐으면 앱 하나짜리 토큰들로 쪼개서(카테고리/웹사이트는 묶음 하나로)
    // 각각 따로 등록한다 — 그래야 앱별 상세/사용 시간/해제가 앱 단위로 동작한다.
    const addedTokens = splitSelection(addedToken);
    const registeredAt = Date.now();
    addedTokens.forEach((token, index) => {
      const appId = `app-${registeredAt}-${index}`;
      lockApp(appId, token);
      registerAppSelection(appId, token, `잠긴 앱 ${selectedAppIds.length + index + 1}`);
    });

    // 쉴드 화면 문구/버튼 설정과, DeviceActivityReport 데이터는 애플 쪽 집계 주기 때문에 등록
    // 직후엔 비어있을 수 있다 — 강제 새로고침 API는 아니지만 모니터링 파이프라인은 바로 돌게 시도한다.
    ReactNativeDeviceActivity.updateShield(SHIELD_CONFIGURATION, SHIELD_ACTIONS, 'app-registered');
    ReactNativeDeviceActivity.reloadDeviceActivityCenter();
    router.replace('/(lock)/goal-time');
  };

  const titleColor = isDark ? '#FFFFFF' : gray[800];

  return (
    <View style={[styles.root, !isDark && styles.rootLight]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTexts}>
            <Text style={[styles.title, { color: titleColor }]}>잠글 앱을 선택해 주세요.</Text>
            <Text style={styles.subtitle}>언제든 변경 가능해요.</Text>
          </View>
          <Pressable hitSlop={12} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.pickerWrap}>
          {isAuthorized ? (
            <ReactNativeDeviceActivity.DeviceActivitySelectionView
              style={styles.picker}
              familyActivitySelection={pendingToken}
              onSelectionChange={(event) => handleSelectionChange(event.nativeEvent)}
            />
          ) : (
            <Text style={styles.hint}>앱 선택 화면을 불러오는 중이에요…</Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  rootLight: {
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[24],
    paddingBottom: spacing[16],
  },
  headerTexts: {
    flex: 1,
    gap: spacing[8],
  },
  title: {
    ...typography.primary.h3,
  },
  subtitle: {
    ...typography.primary.body2M,
    color: gray[400],
  },
  doneText: {
    ...typography.primary.body2M,
    color: green[300],
  },
  pickerWrap: {
    flex: 1,
    // marginHorizontal: spacing[16],
    // marginBottom: spacing[16],
    borderRadius: radius[16],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    flex: 1,
    alignSelf: 'stretch',
  },
  hint: {
    ...typography.primary.body2R,
    color: gray[400],
  },
});
