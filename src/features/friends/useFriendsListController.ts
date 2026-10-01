import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import { getFriend } from '../../api/generated/friend/friend';
import { getUserErrorMessage, normalizeError } from '../../api/errors';
import { createFriendsListStore } from './friendsListData';

export { filterFriendsByName } from './friendsListData';
export type { FriendsListItem, FriendReceivedRequest } from './friendsListData';

export function useFriendsListController() {
  const [store] = useState(() =>
    createFriendsListStore(getFriend(), (error) => getUserErrorMessage(normalizeError(error)))
  );
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useFocusEffect(
    useCallback(() => {
      void store.refresh();
      return store.cancelRefresh;
    }, [store])
  );

  return {
    ...state,
    refresh: store.refresh,
    acceptRequest: store.acceptRequest,
    rejectRequest: store.rejectRequest,
    deleteFriend: store.deleteFriend,
  };
}

export type FriendsListController = ReturnType<typeof useFriendsListController>;
