import { useFocusEffect } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { getFriend } from '../../api/generated/friend/friend';
import { changeFriendshipAtom, friendsListAtom, refreshFriendsListAtom } from './friendsListAtoms';

export { filterFriendsByName } from './friendsListData';
export type { FriendsListItem, FriendReceivedRequest } from './friendsListData';

const api = getFriend();

export function useFriendsListController() {
  const state = useAtomValue(friendsListAtom);
  const refreshList = useSetAtom(refreshFriendsListAtom);
  const changeFriendship = useSetAtom(changeFriendshipAtom);
  const refresh = useCallback(() => refreshList(api), [refreshList]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return {
    ...state,
    refresh,
    acceptRequest: (requestId: number) => changeFriendship(api, { kind: 'accept', requestId }),
    rejectRequest: (requestId: number) => changeFriendship(api, { kind: 'reject', requestId }),
    deleteFriend: (friendshipId: number) => changeFriendship(api, { kind: 'delete', friendshipId }),
  };
}

export type FriendsListController = ReturnType<typeof useFriendsListController>;
