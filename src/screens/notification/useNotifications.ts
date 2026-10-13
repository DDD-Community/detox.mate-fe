import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useGetMyNotificationsSuspense } from '@/api/notification-query/notifications';
import { groupNotifications } from './notificationSections';

export function useNotifications() {
  const { data, refetch, error, isFetching } = useGetMyNotificationsSuspense();
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      // Mount already fetches; refresh only when returning to this mounted screen.
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch({ cancelRefetch: false });
    }, [refetch])
  );

  if (error && !isFetching) throw error;

  return groupNotifications(data.notifications ?? []);
}
