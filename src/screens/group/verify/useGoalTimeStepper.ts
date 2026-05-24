import { useCallback, useEffect, useRef, useState } from 'react';

const STEP_MINUTES = 10;
const MIN_MINUTES = 0;
const MAX_MINUTES = 24 * 60;
const INITIAL_MINUTES = 2 * 60;
const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 80;

export function useGoalTimeStepper() {
  const [minutes, setMinutes] = useState(INITIAL_MINUTES);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearHold, [clearHold]);

  const apply = useCallback((delta: number) => {
    setMinutes((prev) => {
      const next = prev + delta;
      if (next < MIN_MINUTES) return MIN_MINUTES;
      if (next > MAX_MINUTES) return MAX_MINUTES;
      return next;
    });
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      clearHold();
      apply(delta);
      holdTimeoutRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => apply(delta), HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [apply, clearHold]
  );

  return {
    canDecrease: minutes > MIN_MINUTES,
    canIncrease: minutes < MAX_MINUTES,
    clearHold,
    minutes,
    startDecrease: () => startHold(-STEP_MINUTES),
    startIncrease: () => startHold(STEP_MINUTES),
  };
}
