import { useFocusEffect } from 'expo-router';

import { getFriend } from '../../../api/generated/friend/friend';
import { useFriendsList } from './useFriendsList';

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
