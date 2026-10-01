import { Alert } from 'react-native';

import { useFriendsListController } from '@/features/friends/useFriendsListController';
import { FriendsListView } from './FriendsListView';

export default function FriendsScreen() {
  const controller = useFriendsListController();
  return (
    <FriendsListView
      {...controller}
      onRefresh={controller.refresh}
      onAccept={controller.acceptRequest}
      onReject={controller.rejectRequest}
      onDelete={controller.deleteFriend}
      onShare={() => Alert.alert('친구 초대', '친구 초대 링크는 준비 중이에요.')}
    />
  );
}
