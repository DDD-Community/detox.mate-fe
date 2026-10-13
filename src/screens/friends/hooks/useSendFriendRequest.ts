import { isCancel } from 'axios';
import { useRef, useState } from 'react';

import { getAuthenticatedRequestSignal } from '../../../api/client';
import type { AppError } from '../../../api/errors/types';
import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import { logError } from '../../../api/errors/logger';
import { useSendRequest } from '../../../api/query-generated/friend';
import { trackEvent } from '../../../lib/analytics';

export function useSendFriendRequest(targetUserId: number, onConflict: () => Promise<boolean>) {
  const lock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useSendRequest<AppError, AbortSignal>({
    mutation: {
      onMutate: () => {
        setError(null);
        return getAuthenticatedRequestSignal();
      },
      onError: async (failure, _variables, session) => {
        if (isCancel(failure) || session?.aborted) return;
        let error = normalizeError(failure);
        if (error.status === 409) {
          try {
            if (await onConflict()) return;
          } catch (failure) {
            if (isCancel(failure) || session?.aborted) return;
            error = normalizeError(failure);
            logError(error, { scope: 'api', operation: 'refreshFriendRelationship' });
          }
        }
        if (!session?.aborted) setError(getUserErrorMessage(error));
      },
      onSuccess: (_data, _variables, session) => {
        if (session?.aborted) return;
        try {
          trackEvent('Friend Request Sent');
        } catch (failure) {
          logError(normalizeError(failure), { scope: 'api', operation: 'logFriendRequestSent' });
        }
      },
    },
  });
  const send = async () => {
    if (lock.current || mutation.isPending || mutation.isSuccess) return;
    lock.current = true;
    try {
      await mutation.mutateAsync({ data: { targetUserId } });
    } catch {
      // API 실패 기록은 interceptor, 상태 복구와 안내는 onError가 맡는다.
      return;
    } finally {
      lock.current = false;
    }
  };
  return { send, pending: mutation.isPending, completed: mutation.isSuccess, error };
}
