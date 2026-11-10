import { AppState } from 'react-native';

import { useLockStore } from '../stores/lockStore';

const msUntilNextMidnight = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
};

/**
 * 해제 횟수를 매일 00:00에 0으로 되돌린다. 앱이 꺼져 있으면 타이머가 돌지 않으므로 세 군데서 맞춘다:
 * 저장소 복원 직후(콜드 스타트), 앱이 포그라운드로 돌아올 때, 켜져 있는 채로 자정을 넘길 때.
 * 반환값은 정리 함수.
 */
export const startDailyUnlockCountReset = () => {
  const reset = () => useLockStore.getState().resetUnlockCountsIfNewDay();

  // 복원 전에 호출하면 빈 목록을 기준으로 날짜만 오늘로 바꿔 버리므로 복원이 끝난 뒤에 맞춘다.
  const stopHydration = useLockStore.persist.onFinishHydration(reset);
  if (useLockStore.persist.hasHydrated()) reset();

  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') reset();
  });

  let timer: ReturnType<typeof setTimeout>;
  const scheduleMidnight = () => {
    // 자정 직후 1초 여유를 둬서 타이머가 조금 일찍 깨도 같은 날로 판정되지 않게 한다.
    timer = setTimeout(() => {
      reset();
      scheduleMidnight();
    }, msUntilNextMidnight() + 1000);
  };
  scheduleMidnight();

  return () => {
    stopHydration();
    appState.remove();
    clearTimeout(timer);
  };
};
