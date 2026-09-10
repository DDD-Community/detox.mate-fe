import { create } from 'zustand';
import { MOCK_APP_CATALOG } from '../screens/lock/mockLockApps';

export interface LockedAppUsage {
  id: string;
  name: string;
  usedMinutes: number;
  registeredAt: string;
}

interface LockState {
  selectedAppIds: string[];
  targetMinutes: number;
  lockedApps: LockedAppUsage[];
  setSelectedAppIds: (ids: string[]) => void;
  confirmTargetMinutes: (minutes: number) => void;
  unregisterApp: (id: string) => void;
}

const DEFAULT_TARGET_MINUTES = 120;
// 잠금 해제 횟수는 실기기 연동 전까지 추적하지 않고, 화면에는 항상 "n회"로 표시한다.

const formatRegisteredDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// react-native-device-activity 도입 전까지, 선택된 앱마다 임의의 사용량을 만들어 UI를 채운다.
// 이미 등록된 앱은 기존 사용량/등록일을 유지하고, 새로 추가된 앱만 목업 값을 생성한다.
const buildMockUsage = (ids: string[], previous: LockedAppUsage[]): LockedAppUsage[] =>
  ids.map((id, index) => {
    const existing = previous.find((app) => app.id === id);
    if (existing) return existing;

    return {
      id,
      name: MOCK_APP_CATALOG.find((app) => app.id === id)?.name ?? id,
      usedMinutes: 20 + index * 6,
      registeredAt: formatRegisteredDate(new Date()),
    };
  });

export const useLockStore = create<LockState>((set) => ({
  selectedAppIds: [],
  targetMinutes: DEFAULT_TARGET_MINUTES,
  lockedApps: [],
  setSelectedAppIds: (ids) => set({ selectedAppIds: ids }),
  confirmTargetMinutes: (minutes) =>
    set((state) => ({
      targetMinutes: minutes,
      lockedApps: buildMockUsage(state.selectedAppIds, state.lockedApps),
    })),
  unregisterApp: (id) =>
    set((state) => ({
      selectedAppIds: state.selectedAppIds.filter((existingId) => existingId !== id),
      lockedApps: state.lockedApps.filter((app) => app.id !== id),
    })),
}));
