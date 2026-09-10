import { create } from 'zustand';
import { MOCK_APP_CATALOG } from '../screens/lock/mockLockApps';

export interface LockedAppUsage {
  id: string;
  name: string;
  usedMinutes: number;
  unlockCount: number;
}

interface LockState {
  selectedAppIds: string[];
  targetMinutes: number;
  lockedApps: LockedAppUsage[];
  setSelectedAppIds: (ids: string[]) => void;
  confirmTargetMinutes: (minutes: number) => void;
}

const DEFAULT_TARGET_MINUTES = 120;

// react-native-device-activity 도입 전까지, 선택된 앱마다 임의의 사용량을 만들어 UI를 채운다.
const buildMockUsage = (ids: string[]): LockedAppUsage[] =>
  ids.map((id, index) => ({
    id,
    name: MOCK_APP_CATALOG.find((app) => app.id === id)?.name ?? id,
    usedMinutes: 20 + index * 6,
    unlockCount: 5,
  }));

export const useLockStore = create<LockState>((set, get) => ({
  selectedAppIds: [],
  targetMinutes: DEFAULT_TARGET_MINUTES,
  lockedApps: [],
  setSelectedAppIds: (ids) => set({ selectedAppIds: ids }),
  confirmTargetMinutes: (minutes) =>
    set({
      targetMinutes: minutes,
      lockedApps: buildMockUsage(get().selectedAppIds),
    }),
}));
