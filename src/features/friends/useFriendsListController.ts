import { useFocusEffect } from 'expo-router';

import { getFriend } from '../../api/generated/friend/friend';
import { useFriendsList } from './useFriendsList';

export { filterFriendsByName } from './friendsListData';
export type { FriendsListItem, FriendReceivedRequest } from './friendsListData';

const api = getFriend();

export function useFriendsListController() {
  const { onFocus, changeFriendship, ...state } = useFriendsList(api);
  useFocusEffect(onFocus);

  return {
    ...state,
    acceptRequest: (requestId: number) => changeFriendship({ kind: 'accept', requestId }),
    rejectRequest: (requestId: number) => changeFriendship({ kind: 'reject', requestId }),
    deleteFriend: (friendshipId: number) => changeFriendship({ kind: 'delete', friendshipId }),
  };
}

export type FriendsListController = ReturnType<typeof useFriendsListController>;
