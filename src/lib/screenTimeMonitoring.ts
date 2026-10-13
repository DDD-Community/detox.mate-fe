import * as ReactNativeDeviceActivity from 'react-native-device-activity';

/**
 * Apple은 앱별 "오늘 N분 썼다"는 숫자를 메인 앱(JS)에 절대 넘겨주지 않는다. 대신
 * DeviceActivityMonitor로 "N분 넘었다/안 넘었다"는 임계값 이벤트만 받을 수 있다.
 * 그래서 하루 동안 10분 단위로 촘촘하게 임계값을 걸어두고, 마지막으로 통과한
 * 임계값을 "오늘 대략 이만큼 썼다"의 근사치로 쓴다 — 스크린타임 앱들이 흔히 쓰는
 * 우회법이다. (정확한 분 단위는 알 수 없고, THRESHOLD_STEP_MINUTES 단위로만 근사된다.)
 */
export const THRESHOLD_STEP_MINUTES = 10;
export const THRESHOLD_MAX_MINUTES = 180;

export const buildUsageActivityName = (appId: string) => `usage-${appId}`;

const buildThresholdEventName = (minutes: number) => `t${minutes}`;

export const parseThresholdEventName = (eventName: string): number | null => {
  const match = /^t(\d+)$/.exec(eventName);
  if (!match) return null;
  return Number(match[1]);
};

const midnight = { hour: 0, minute: 0, second: 0 };
const endOfDay = { hour: 23, minute: 59, second: 59 };

/**
 * 잠긴 앱 하나에 대해, 자정~자정 반복 스케줄 + 10분 단위 임계값 이벤트들을 건다.
 * 이미 걸려있어도 다시 호출하면 그대로 덮어써서 안전하다(멱등).
 */
export const startDailyUsageMonitoring = async (appId: string, token: string) => {
  const events: ReactNativeDeviceActivity.DeviceActivityEvent[] = [];
  for (
    let minutes = THRESHOLD_STEP_MINUTES;
    minutes <= THRESHOLD_MAX_MINUTES;
    minutes += THRESHOLD_STEP_MINUTES
  ) {
    events.push({
      familyActivitySelection: token,
      threshold: { minute: minutes },
      eventName: buildThresholdEventName(minutes),
    });
  }

  await ReactNativeDeviceActivity.startMonitoring(
    buildUsageActivityName(appId),
    { intervalStart: midnight, intervalEnd: endOfDay, repeats: true },
    events
  );
};

/**
 * 현재 잠겨있는 앱 전부에 대해 일일 사용량 모니터링이 걸려있는지 보장한다.
 * 앱 실행 시, 그리고 새 앱을 등록할 때마다 호출한다.
 */
export const ensureDailyUsageMonitoring = async (
  apps: { id: string }[],
  selectionsByAppId: Record<string, string>
) => {
  await Promise.all(
    apps.map((app) => {
      const token = selectionsByAppId[app.id];
      if (!token) return Promise.resolve();
      return startDailyUsageMonitoring(app.id, token).catch(() => undefined);
    })
  );
};

export type DailyThresholdEvent = {
  dateKey: string;
  minutes: number;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 특정 앱의 임계값 이벤트들을 읽어서, 날짜별로 "그날 통과한 가장 큰 임계값"을 돌려준다.
 * (= 그날 근사 사용 분. intervalDidEnd 이후엔 그 날짜의 값이 더 이상 안 바뀐다.)
 */
export const readDailyThresholdsForApp = (appId: string): DailyThresholdEvent[] => {
  const events = ReactNativeDeviceActivity.getEvents(buildUsageActivityName(appId));
  const maxMinutesByDate = new Map<string, number>();

  for (const event of events) {
    if (event.callbackName !== 'eventDidReachThreshold' || !event.eventName) continue;
    const minutes = parseThresholdEventName(event.eventName);
    if (minutes === null) continue;

    const dateKey = toDateKey(new Date(event.lastCalledAt));
    const existing = maxMinutesByDate.get(dateKey) ?? 0;
    if (minutes > existing) maxMinutesByDate.set(dateKey, minutes);
  }

  return Array.from(maxMinutesByDate.entries()).map(([dateKey, minutes]) => ({ dateKey, minutes }));
};
