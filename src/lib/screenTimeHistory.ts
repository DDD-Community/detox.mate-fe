import AsyncStorage from '@react-native-async-storage/async-storage';
import { readDailyThresholdsForApp } from './screenTimeMonitoring';

const STORAGE_KEY_PREFIX = 'screenTimeHistory:';
const MAX_DAYS_KEPT = 7;

type DailyHistory = Record<string, number>; // dateKey -> approx minutes used that day

const storageKeyForApp = (appId: string) => `${STORAGE_KEY_PREFIX}${appId}`;

// screenTimeMonitoring.ts의 toDateKey와 동일하게 "로컬" 날짜 기준이어야 한다 —
// toISOString()은 UTC라서 자정 근처에 날짜가 하루 어긋날 수 있다.
const todayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadHistory = async (appId: string): Promise<DailyHistory> => {
  const raw = await AsyncStorage.getItem(storageKeyForApp(appId));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as DailyHistory;
  } catch {
    return {};
  }
};

const saveHistory = async (appId: string, history: DailyHistory) => {
  await AsyncStorage.setItem(storageKeyForApp(appId), JSON.stringify(history));
};

/**
 * 오늘 기준 최근 MAX_DAYS_KEPT일치만 남기고 정리한다.
 */
const pruneHistory = (history: DailyHistory): DailyHistory => {
  const sortedDateKeys = Object.keys(history).sort().reverse();
  const kept = sortedDateKeys.slice(0, MAX_DAYS_KEPT);
  const next: DailyHistory = {};
  for (const dateKey of kept) next[dateKey] = history[dateKey];
  return next;
};

/**
 * DeviceActivityMonitor가 기록해둔 임계값 이벤트를 읽어, 로컬 히스토리에 날짜별로
 * 병합 저장한다. 앱이 켜질 때마다 호출하면 된다 — 오늘 값은 아직 늘어나는 중이라
 * 매번 최신값으로 덮어쓰고, 지난 날짜는 더 큰 값이 나올 때만 갱신한다.
 */
export const syncScreenTimeHistory = async (appIds: string[]) => {
  await Promise.all(
    appIds.map(async (appId) => {
      const history = await loadHistory(appId);
      const thresholds = readDailyThresholdsForApp(appId);

      for (const { dateKey, minutes } of thresholds) {
        history[dateKey] = Math.max(history[dateKey] ?? 0, minutes);
      }

      await saveHistory(appId, pruneHistory(history));
    })
  );
};

/**
 * 오늘을 제외한 최근 최대 7일의 근사 사용 분 평균. 데이터가 하루도 없으면 null.
 */
export const getSevenDayAverageMinutes = async (appId: string): Promise<number | null> => {
  const history = await loadHistory(appId);
  const todayKey = todayDateKey();
  const pastDaysMinutes = Object.entries(history)
    .filter(([dateKey]) => dateKey !== todayKey)
    .map(([, minutes]) => minutes);

  if (pastDaysMinutes.length === 0) return null;

  const total = pastDaysMinutes.reduce((sum, minutes) => sum + minutes, 0);
  return Math.round(total / pastDaysMinutes.length);
};

/**
 * 오늘 지금까지의 근사 사용 분(10분 단위 임계값 기준). 아직 어떤 임계값도
 * 안 넘었으면(또는 데이터가 없으면) null — "0분"과 "아직 모름"을 구분한다.
 */
export const getTodayApproxMinutes = async (appId: string): Promise<number | null> => {
  const history = await loadHistory(appId);
  return history[todayDateKey()] ?? null;
};
