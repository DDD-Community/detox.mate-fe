import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { differenceTokens, unionTokens } from '../../lib/familyActivitySelections';
import { lockApp } from '../../lib/lockRegistration';
import { SHIELD_ACTIONS, SHIELD_CONFIGURATION } from '../../lib/shieldConfig';
import { splitSelection } from '../../../modules/screen-time-report';
import { useLockStore } from '../../stores/lockStore';
import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';

// 피커가 뜨면서 초기 상태로 들어오는 빈 선택 이벤트를 걸러내는 시간.
const EMPTY_EVENT_GRACE_MS = 1000;

export function useAppSelection({ requireSelection }: { requireSelection: boolean }) {
  const saving = useRef(false);
  const { selectedAppIds, familyActivitySelectionsByAppId, registerAppSelection } = useLockStore();
  const [initialUnionToken] = useState(() =>
    unionTokens(Object.values(familyActivitySelectionsByAppId))
  );
  const [pendingToken, setPendingToken] = useState<string | null>(initialUnionToken);
  // 가장 최근 선택(null = 아무것도 선택 안 함). 상태(pendingToken)는 재렌더가 끝나야 반영돼서
  // "완료"를 누른 시점의 상태가 한 박자 늦을 수 있다 — ref는 이벤트 즉시 갱신된다.
  const latestTokenRef = useRef<string | null>(initialUnionToken);
  const mountedAtRef = useRef(Date.now());

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
    } else if (Date.now() - mountedAtRef.current > EMPTY_EVENT_GRACE_MS) {
      // 피커가 막 뜰 때 들어오는 초기 빈 이벤트는 무시하고, 그 뒤의 빈 선택은 "전부 해제"로 본다.
      latestTokenRef.current = null;
    }
    setPendingToken(latestTokenRef.current);
  };

  // 시트가 아니라 화면 안에 끼운 피커라서 닫힘 이벤트/애니메이션을 기다리지 않고, "완료"를 누른
  // 시점의 마지막 선택(ref)을 바로 처리한다.
  const saveSelection = () => {
    const newToken = latestTokenRef.current;
    if (saving.current || (requireSelection && !newToken)) return;
    saving.current = true;
    try {
      // 이 화면에서는 새로 잠글 앱만 추가한다. 이미 잠근 앱의 체크를 해제해도 등록 해제하지 않는다 —
      // 등록 해제는 앱별 리포트의 [등록 해제](10초 타이머 → 사유 선택 → 확인 모달)로만 한다.
      // 선택이 비었으면 새로 추가할 게 없다.
      if (!newToken) {
        return { addedAppCount: 0 };
      }

      // 새로 추가된 부분(이전엔 없었는데 이번에 체크된 것)만 새 그룹으로 등록한다.
      const addedToken = initialUnionToken
        ? differenceTokens(newToken, initialUnionToken)
        : newToken;

      if (!addedToken) {
        return { addedAppCount: 0 };
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
      ReactNativeDeviceActivity.updateShield(
        SHIELD_CONFIGURATION,
        SHIELD_ACTIONS,
        'app-registered'
      );
      ReactNativeDeviceActivity.reloadDeviceActivityCenter();
      return { addedAppCount: addedTokens.length };
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'api', operation: 'registerLockedApps' });
      saving.current = false;
      Alert.alert('앱을 잠글 수 없어요', getUserErrorMessage(appError));
    }
  };

  return {
    selection: pendingToken,
    hasSelection: Boolean(pendingToken),
    handleSelectionChange,
    saveSelection,
  };
}
