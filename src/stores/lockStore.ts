import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { syncTargetMinutes } from '../lib/sharedDisplayConfig';

export interface LockedAppUsage {
  id: string;
  name: string;
  unlockCount: number;
  registeredAt: string;
}

interface LockState {
  selectedAppIds: string[];
  // 사용자가 제한 시간을 정하기 전에는 null — 기본값을 임의로 두지 않는다.
  targetMinutes: number | null;
  lockedApps: LockedAppUsage[];
  // unlockCount가 집계된 날짜(YYYY-MM-DD, 기기 로컬). 오늘이 아니면 해제 횟수는 어제 값이다.
  unlockCountDate: string;
  // 앱 하나를 등록할 때마다 그 앱 전용으로 연 FamilyActivityPicker의 결과 토큰을
  // 표시용 id에 매핑해서 저장한다. 이 토큰이 있어야 그 앱만 골라서 실제로
  // blockSelection/unblockSelection을 걸고 풀 수 있다.
  familyActivitySelectionsByAppId: Record<string, string>;
  setSelectedAppIds: (ids: string[]) => void;
  confirmTargetMinutes: (minutes: number) => void;
  unregisterApp: (id: string) => void;
  registerAppSelection: (appId: string, token: string, name: string) => void;
  extendUsage: (id: string) => void;
  resetUnlockCountsIfNewDay: () => void;
}

const formatRegisteredDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const formatDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

// 날짜가 바뀌었으면 해제 횟수를 전부 0으로 되돌린다. 앱이 꺼져 있던 동안 자정이 지나도
// 다음에 켜질 때 이 함수가 호출되면 맞춰진다.
const withTodaysCounts = (state: LockState): Partial<LockState> => {
  const today = formatDateKey(new Date());
  if (state.unlockCountDate === today) return {};
  return {
    unlockCountDate: today,
    lockedApps: state.lockedApps.map((app) => ({ ...app, unlockCount: 0 })),
  };
};

// zustand 기본값은 순수 인메모리 상태라, 백그라운드에서 iOS가 앱 프로세스를 내렸다가
// 다시 살리면(쉴드/피커 넘나들 때 흔함) lockedApps가 통째로 날아가버렸다 — 실제로
// 겪었던 "두 번째 앱 등록하니 전부 사라짐" 버그의 원인. AsyncStorage에 영속시킨다.
export const useLockStore = create<LockState>()(
  persist(
    (set) => ({
      selectedAppIds: [],
      targetMinutes: null,
      lockedApps: [],
      unlockCountDate: formatDateKey(new Date()),
      familyActivitySelectionsByAppId: {},
      setSelectedAppIds: (ids) => set({ selectedAppIds: ids }),
      confirmTargetMinutes: (minutes) => {
        syncTargetMinutes(minutes);
        set({ targetMinutes: minutes });
      },
      unregisterApp: (id) =>
        set((state) => {
          const nextSelections = { ...state.familyActivitySelectionsByAppId };
          delete nextSelections[id];

          return {
            selectedAppIds: state.selectedAppIds.filter((existingId) => existingId !== id),
            lockedApps: state.lockedApps.filter((app) => app.id !== id),
            familyActivitySelectionsByAppId: nextSelections,
          };
        }),
      registerAppSelection: (appId, token, name) =>
        set((state) => {
          const nextSelectedAppIds = state.selectedAppIds.includes(appId)
            ? state.selectedAppIds
            : [...state.selectedAppIds, appId];

          return {
            selectedAppIds: nextSelectedAppIds,
            lockedApps: [
              ...state.lockedApps,
              { id: appId, name, unlockCount: 0, registeredAt: formatRegisteredDate(new Date()) },
            ],
            familyActivitySelectionsByAppId: {
              ...state.familyActivitySelectionsByAppId,
              [appId]: token,
            },
          };
        }),
      // 10초 재고 타이머를 거쳐 실제로 해제 요청이 완료된 시점에 호출된다.
      // 실제 사용 분은 Apple이 메인 앱으로 넘겨주지 않아 추적할 수 없고, 잠금 해제
      // 횟수만 우리 앱이 직접 세는 값이라 여기서 올린다.
      extendUsage: (id) =>
        set((state) => {
          // 자정이 지난 뒤 첫 해제라면 어제 횟수 위에 더하지 않도록 먼저 0으로 맞춘다.
          const today = { ...state, ...withTodaysCounts(state) };
          return {
            unlockCountDate: today.unlockCountDate,
            lockedApps: today.lockedApps.map((app) =>
              app.id === id ? { ...app, unlockCount: app.unlockCount + 1 } : app
            ),
          };
        }),
      resetUnlockCountsIfNewDay: () => set((state) => withTodaysCounts(state)),
    }),
    {
      name: 'lock-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
