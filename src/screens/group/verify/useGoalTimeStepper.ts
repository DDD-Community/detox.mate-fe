import { useCallback, useEffect, useRef, useState } from 'react';

const STEP_MINUTES = 10;
const INITIAL_MINUTES = 2 * 60;
const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 80;

type UseGoalTimeStepperOptions = {
  initialMinutes?: number;
  minMinutes?: number;
  maxMinutes?: number;
};

export function useGoalTimeStepper({
  initialMinutes = INITIAL_MINUTES,
  minMinutes = 0,
  maxMinutes = 24 * 60,
}: UseGoalTimeStepperOptions = {}) {
  const [minutes, setMinutes] = useState(initialMinutes);
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

  const apply = useCallback(
    (delta: number) => {
      setMinutes((prev) => {
        const next = prev + delta;
        if (next < minMinutes) return minMinutes;
        if (next > maxMinutes) return maxMinutes;
        return next;
      });
    },
    [maxMinutes, minMinutes]
  );

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
    canDecrease: minutes > minMinutes,
    canIncrease: minutes < maxMinutes,
    clearHold,
    minutes,
    setMinutes,
    startDecrease: () => startHold(-STEP_MINUTES),
    startIncrease: () => startHold(STEP_MINUTES),
  };
}
