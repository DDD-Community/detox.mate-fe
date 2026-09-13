import { useEffect, useRef, useState } from 'react';

/**
 * startSeconds부터 1초 간격으로 감소하는 카운트다운. 0에 도달하면 onComplete를 한 번 호출한다.
 */
export function useCountdown(startSeconds: number, onComplete?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(startSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onCompleteRef.current?.();
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return secondsLeft;
}
