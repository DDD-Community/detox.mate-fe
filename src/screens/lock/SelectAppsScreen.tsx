import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  differenceTokens,
  getSelectionItemCount,
  unionTokens,
} from '../../lib/familyActivitySelections';
import { registerAppShield, SHIELD_ACTIONS, SHIELD_CONFIGURATION } from '../../lib/shieldConfig';
import { startDailyUsageMonitoring } from '../../lib/screenTimeMonitoring';
import { primitiveColors, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray } = primitiveColors;

const DARK_BG = '#0B0B0C';

/**
 * 실제 iOS 앱 선택 화면(FamilyActivityPicker)을 바로 띄운다. 앱 이름/아이콘은
 * 토큰만으로는 절대 읽을 수 없어서(애플 정책), 화면 표시용 이름은 "잠긴 앱 N"으로
 * 자동으로 붙인다 — 실제 이름/아이콘이 필요한 곳(리포트 화면)은 ScreenTimeReportView가
 * Label(token)로 따로 보여준다.
 *
 * 각 등록 그룹(잠긴 앱 N)은 여전히 각자의 토큰을 따로 들고 있어서(개별 해제/타이머를
 * 위해 필요) — 다만 피커를 "다시 열 때"는 지금까지 등록된 전체를 하나로 합친
 * 토큰(union)을 미리 체크된 상태로 보여주고, 닫을 때 차집합으로 새로 추가된 것만 새
 * 그룹으로 등록한다. 등록 해제는 여기서 하지 않는다(상세 화면의 "등록 해제"로만).
 */
export default function SelectAppsScreen() {
  const router = useRouter();
  const { selectedAppIds, familyActivitySelectionsByAppId, registerAppSelection } = useLockStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [initialUnionToken] = useState(() =>
    unionTokens(Object.values(familyActivitySelectionsByAppId))
  );
  const [pendingToken, setPendingToken] = useState<string | null>(initialUnionToken);
  // 가장 최근에 받은 "비어있지 않은" 선택. 상태(pendingToken)는 재렌더가 끝나야 반영돼서,
  // "완료" 직후 마지막 선택 이벤트와 닫힘 이벤트가 붙어 들어오면 닫힘 처리 시점의 상태가
  // 한 박자 늦은(= 방금 체크한 앱이 빠진) 값일 수 있다 — ref는 이벤트 즉시 갱신된다.
  const latestTokenRef = useRef<string | null>(initialUnionToken);

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
      setIsPickerOpen(true);
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
    }
    setPendingToken(token);
  };

  const handleDismiss = () => {
    setIsPickerOpen(false);
    setPendingToken(null);
    // 닫힘 직후에 마지막 선택 이벤트가 한 번 더 들어올 수 있어서 잠깐 기다렸다가 처리한다.
    setTimeout(processSelection, 200);
  };

  const processSelection = () => {
    const newToken = latestTokenRef.current;

    // 네이티브 피커 시트가 닫히는 애니메이션이 끝나기 전에 바로 router.push를 하면,
    // 다음 화면이 그 시트 전환 애니메이션에 묻어서 마치 바텀시트처럼 아래에서 올라오는
    // 것처럼 보인다. 시트가 완전히 사라진 뒤에 이동하도록 살짝 지연시킨다.
    const navigate = (action: () => void) => setTimeout(action, 350);

    // newToken이 비어있거나(X로 취소) "유효한 빈 선택"으로 들어오면(닫히는 애니메이션
    // 도중 onSelectionChange가 마지막으로 한 번 더 빈 값을 쏘는 경우가 있었다 — 실제로
    // 겪었던 "앱 하나 더 추가하니 전부 사라짐" 버그의 원인) 아무것도 건드리지 않는다.
    if (!newToken || latestCountRef.current === 0) {
      navigate(() => router.back());
      return;
    }

    // 새로 추가된 부분(이전엔 없었는데 이번에 체크된 것)만 새 그룹으로 등록한다.
    const addedToken = initialUnionToken ? differenceTokens(newToken, initialUnionToken) : newToken;

    // 한 번에 여러 앱을 묶어서 추가하면, 애플이 그걸 쪼갤 수 없는 토큰 하나로
    // 합쳐버려서 이후엔 앱별로 따로 상세/해제를 할 수 없게 된다 — 그래서 추가는
    // 한 번에 하나씩만 허용한다(이미 등록된 앱을 체크 해제하는 건 영향 없음).
    // 기존 등록이 없으면 추가분 = 이번 선택 전체라서 이벤트의 개수를 그대로 쓴다.
    const addedCount = addedToken
      ? initialUnionToken
        ? getSelectionItemCount(addedToken)
        : latestCountRef.current
      : 0;
    if (addedCount > 1) {
      Alert.alert(
        '한 번에 하나씩만 추가할 수 있어요',
        '여러 앱을 한 번에 선택하면 나중에 앱별로 따로 관리할 수 없어요. 앱을 하나만 선택해서 다시 시도해주세요.',
        [{ text: '확인' }]
      );
      navigate(() => router.back());
      return;
    }

    if (addedToken) {
      const appId = `app-${Date.now()}`;

      ReactNativeDeviceActivity.blockSelection(
        { activitySelectionToken: addedToken },
        'app-registered'
      );
      // 예전에 "잠깐 해제"로 화이트리스트에 들어간 채 남아있으면(재잠금이 실패했거나, 해제 후
      // 등록 해제했다가 다시 추가한 경우) 화이트리스트가 차단보다 우선해서 앱이 안 잠긴다.
      ReactNativeDeviceActivity.removeSelectionFromWhitelistAndUpdateBlock(
        { activitySelectionToken: addedToken },
        'app-registered'
      );
      // 쉴드 화면 문구/버튼과, 버튼을 눌렀을 때 우리 앱으로 돌아오는 동작을 설정한다.
      ReactNativeDeviceActivity.updateShield(
        SHIELD_CONFIGURATION,
        SHIELD_ACTIONS,
        'app-registered'
      );
      // DeviceActivityReport 데이터는 애플 쪽 집계 주기 때문에 등록 직후엔 비어있을 수
      // 있다 — 강제 새로고침 API는 아니지만, 최소한 모니터링 파이프라인은 바로 돌게
      // 시도해본다(안 되더라도 조금 뒤엔 저절로 채워진다).
      ReactNativeDeviceActivity.reloadDeviceActivityCenter();
      registerAppSelection(appId, addedToken, `잠긴 앱 ${selectedAppIds.length + 1}`);
      // 이 앱의 해제 요청이 어떤 앱인지 알림에 담기도록 앱별 쉴드 설정을 등록한다.
      registerAppShield(appId, addedToken);
      // 최근 7일 평균 계산용 — 등록 즉시 오늘부터 일일 임계값 모니터링을 시작한다.
      startDailyUsageMonitoring(appId, addedToken).catch(() => undefined);
      navigate(() => router.push('/(lock)/goal-time'));
    } else {
      navigate(() => router.back());
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Text style={styles.hint}>앱 선택 화면을 불러오는 중이에요…</Text>
      </SafeAreaView>

      {isPickerOpen && (
        <ReactNativeDeviceActivity.DeviceActivitySelectionSheetView
          style={{ width: 1, height: 1, position: 'absolute' }}
          familyActivitySelection={pendingToken}
          onDismissRequest={handleDismiss}
          onSelectionChange={(event) => handleSelectionChange(event.nativeEvent)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...typography.primary.body2R,
    color: gray[400],
  },
});
