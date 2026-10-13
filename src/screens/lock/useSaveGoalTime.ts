import { useEffect, useRef, useState } from 'react';
import { getTimeLimit } from '@/api/generated/time-limit/time-limit';
import { handleRequestError, logError } from '@/api/errors';
import { trackEvent } from '@/lib/analytics';
import { useLockStore } from '@/stores/lockStore';

export function useSaveGoalTime(mode: string) {
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saving = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const save = async (minutes: number) => {
    if (saving.current) return false;
    saving.current = true;
    setPending(true);
    setErrorMessage(null);
    try {
      await getTimeLimit().set({ totalLockMinutes: minutes });
      if (!active.current) return false;
      useLockStore.getState().confirmTargetMinutes(minutes);
      trackEvent('Goal Time Set', { mode });
      return true;
    } catch (error) {
      const handled = handleRequestError(error);
      logError(handled.error, { scope: 'api', operation: 'saveGoalTime' });
      // 통신 오류는 기존 전역 토스트가 안내하고, 나머지 실패는 입력 아래에서 안내한다.
      if (active.current && handled.presentation !== 'toast') setErrorMessage(handled.message);
      saving.current = false;
      return false;
    } finally {
      if (active.current) setPending(false);
    }
  };
  return { save, pending, errorMessage };
}
