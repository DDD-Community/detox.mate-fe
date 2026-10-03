import { create } from 'zustand';

export interface LockedAppUsage {
  id: string;
  name: string;
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
  extendUsage: (id: string) => void;
}

const DEFAULT_TARGET_MINUTES = 120;

const formatRegisteredDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

export const useLockStore = create<LockState>((set) => ({
  selectedAppIds: [],
  targetMinutes: DEFAULT_TARGET_MINUTES,
  lockedApps: [],
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
    set((state) => ({
      lockedApps: state.lockedApps.map((app) =>
        app.id === id ? { ...app, unlockCount: app.unlockCount + 1 } : app
      ),
    })),
}));
