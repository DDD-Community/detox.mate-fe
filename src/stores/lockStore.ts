import { create } from 'zustand';

export interface LockedAppUsage {
  id: string;
  name: string;
  usedMinutes: number;
  unlockCount: number;
  registeredAt: string;
}

interface LockState {
  selectedAppIds: string[];
  targetMinutes: number;
  lockedApps: LockedAppUsage[];
  // 앱 하나를 등록할 때마다 그 앱 전용으로 연 FamilyActivityPicker의 결과 토큰을
  // 표시용 id에 매핑해서 저장한다. 이 토큰이 있어야 그 앱만 골라서 실제로
  // blockSelection/unblockSelection을 걸고 풀 수 있다.
  familyActivitySelectionsByAppId: Record<string, string>;
  setSelectedAppIds: (ids: string[]) => void;
  confirmTargetMinutes: (minutes: number) => void;
  unregisterApp: (id: string) => void;
  registerAppSelection: (appId: string, token: string, name: string) => void;
  extendUsage: (id: string, minutes: number) => void;
}

const DEFAULT_TARGET_MINUTES = 120;

const formatRegisteredDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const createMockUsage = (id: string, name: string, index: number): LockedAppUsage => ({
  id,
  name,
  usedMinutes: 20 + index * 6,
  unlockCount: 3 + index * 2,
  registeredAt: formatRegisteredDate(new Date()),
});

// 앱별 상세 지표(분/회/%) UI를 바로 확인할 수 있게, 목업 앱 2개를 이미 선택된 것으로 시드해둔다.
// 실제 피커를 거치지 않은 mock 데이터라 familyActivitySelectionsByAppId엔 토큰이 없다 — 즉 실제로 잠겨있진 않다.
const DEFAULT_LOCKED_APPS: LockedAppUsage[] = [
  createMockUsage('instagram', 'Instagram', 0),
  createMockUsage('youtube', 'YouTube', 1),
];

export const useLockStore = create<LockState>((set) => ({
  selectedAppIds: DEFAULT_LOCKED_APPS.map((app) => app.id),
  targetMinutes: DEFAULT_TARGET_MINUTES,
  lockedApps: DEFAULT_LOCKED_APPS,
  familyActivitySelectionsByAppId: {},
  setSelectedAppIds: (ids) => set({ selectedAppIds: ids }),
  confirmTargetMinutes: (minutes) => set({ targetMinutes: minutes }),
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
        lockedApps: [...state.lockedApps, createMockUsage(appId, name, state.lockedApps.length)],
        familyActivitySelectionsByAppId: {
          ...state.familyActivitySelectionsByAppId,
          [appId]: token,
        },
      };
    }),
  // 10초 재고 타이머를 거쳐 실제로 해제 요청이 완료된 시점에 호출된다.
  // 사용 시간을 늘리는 김에, 이제 실제로 추적하는 잠금 해제 횟수도 여기서 함께 올린다.
  extendUsage: (id, minutes) =>
    set((state) => ({
      lockedApps: state.lockedApps.map((app) =>
        app.id === id
          ? { ...app, usedMinutes: app.usedMinutes + minutes, unlockCount: app.unlockCount + 1 }
          : app
      ),
    })),
}));
