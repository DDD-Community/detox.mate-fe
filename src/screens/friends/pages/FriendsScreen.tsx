import { useSuspenseQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native';

import { useAuthSessionStore, type AuthScope } from '../../../stores/authSessionStore';
import { friendsQueryOptions, receivedRequestsQueryOptions } from '../hooks/friendsQueries';
import { useFriendsListController } from '../hooks/useFriendsListController';
import {
  FriendsListView,
  FriendsSection,
  ReceivedRequestsSection,
} from '../components/FriendsListView';
import { FriendsQueryFeedback, FriendsQuerySection } from '../components/FriendsQuerySection';
import { toFriendListItem, toReceivedRequest } from '../utils/friendsListData';

const share = () => Alert.alert('친구 초대', '친구 초대 링크는 준비 중이에요.');

type Actions = ReturnType<typeof useFriendsListController>;

function FriendsContent({
  scope,
  query,
  onSelectDelete,
  actions,
}: {
  scope: AuthScope;
  query: string;
  onSelectDelete: (friend: ReturnType<typeof toFriendListItem>) => void;
  actions: Actions;
}) {
  const result = useSuspenseQuery(friendsQueryOptions(scope));
  return (
    <>
      {result.error && !result.isFetching ? (
        <FriendsQueryFeedback
          error={result.error}
          onRetry={() => {
            void actions.refreshFriends();
          }}
        />
      ) : null}
      <FriendsSection
        friends={result.data.map(toFriendListItem)}
        query={query}
        pendingActionId={actions.pendingActionId}
        onSelectDelete={onSelectDelete}
        onShare={share}
      />
    </>
  );
}

function ReceivedContent({
  scope,
  onConfirmAccept,
  actions,
}: {
  scope: AuthScope;
  onConfirmAccept: Parameters<
    NonNullable<React.ComponentProps<typeof FriendsListView>['renderReceived']>
  >[0];
  actions: Actions;
}) {
  const result = useSuspenseQuery(receivedRequestsQueryOptions(scope));
  return (
    <>
      {result.error && !result.isFetching ? (
        <FriendsQueryFeedback
          error={result.error}
          onRetry={() => {
            void actions.refreshRequests();
          }}
        />
      ) : null}
      <ReceivedRequestsSection
        receivedRequests={result.data.map(toReceivedRequest)}
        pendingActionId={actions.pendingActionId}
        onConfirmAccept={onConfirmAccept}
        onReject={actions.rejectRequest}
      />
    </>
  );
}

function AuthenticatedFriendsScreen({ scope }: { scope: AuthScope }) {
  const actions = useFriendsListController(scope);
  return (
    <FriendsListView
      {...actions}
      onRefresh={actions.refresh}
      onAccept={actions.acceptRequest}
      onReject={actions.rejectRequest}
      onDelete={actions.deleteFriend}
      onShare={share}
      renderReceived={(onConfirmAccept) => (
        <FriendsQuerySection label="받은 요청">
          <ReceivedContent scope={scope} actions={actions} onConfirmAccept={onConfirmAccept} />
        </FriendsQuerySection>
      )}
      renderFriends={(query, onSelectDelete) => (
        <FriendsQuerySection label="친구 목록">
          <FriendsContent
            scope={scope}
            actions={actions}
            query={query}
            onSelectDelete={onSelectDelete}
          />
        </FriendsQuerySection>
      )}
    />
  );
}

export default function FriendsScreen() {
  const { ready, scope } = useAuthSessionStore();
  if (!ready) return <ActivityIndicator accessibilityLabel="로그인 확인 중" />;
  if (!scope) return <Redirect href="/login" />;
  return <AuthenticatedFriendsScreen key={scope.sessionId} scope={scope} />;
}
