import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * startSeconds부터 1초 간격으로 감소하는 카운트다운. 0에 도달하면 onComplete를 한 번 호출한다.
 * pauseInBackground가 true면 앱이 백그라운드로 가 있는 동안 멈췄다가, 돌아오면 이어서 센다.
 */
export function useCountdown(
  startSeconds: number,
  onComplete?: () => void,
  pauseInBackground = false
) {
  const [secondsLeft, setSecondsLeft] = useState(startSeconds);
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!pauseInBackground) return;
    const subscription = AppState.addEventListener('change', (state) =>
      setIsActive(state === 'active')
    );
    return () => subscription.remove();
  }, [pauseInBackground]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onCompleteRef.current?.();
      return;
    }
    if (pauseInBackground && !isActive) return;

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, isActive, pauseInBackground]);

  return secondsLeft;
}
