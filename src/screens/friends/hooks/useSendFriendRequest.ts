import { isCancel } from 'axios';

import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import { logError } from '../../../api/errors/logger';
import { useSendRequest } from '../../../api/query-generated/friend';
import { trackEvent } from '../../../lib/analytics';

export function useSendFriendRequest(targetUserId: number) {
  const mutation = useSendRequest({
    mutation: {
      onSuccess: () => {
        try {
          trackEvent('Friend Request Sent');
        } catch (failure) {
          logError(normalizeError(failure), { scope: 'api', operation: 'logFriendRequestSent' });
        }
      },
    },
  });
  const send = async () => {
    if (mutation.isPending || mutation.isSuccess) return;
    try {
      await mutation.mutateAsync({ data: { targetUserId } });
    } catch {
      // API 실패 기록은 interceptor, 현재 방문의 안내는 mutation.error가 맡는다.
      return;
    }
  };
  const error =
    mutation.error && !isCancel(mutation.error)
      ? getUserErrorMessage(normalizeError(mutation.error))
      : null;
  return { send, pending: mutation.isPending, completed: mutation.isSuccess, error };
}
