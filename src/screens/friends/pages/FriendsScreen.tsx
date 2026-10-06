import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsSuspenseQueryOptions,
} from '../../../api/query-generated/friend';
import { useDebouncedEmail } from '../hooks/useDebouncedEmail';
import { FriendEmailSearch } from '../components/FriendEmailSearch';
import { FriendsErrorFeedback } from '../components/FriendsErrorFeedback';
import { ErrorBoundary } from '../../../components/AppErrorBoundary/AppErrorBoundary';
import { useFriendsListController } from '../hooks/useFriendsListController';
import {
  filterFriendsByName,
  toFriendListItem,
  toReceivedRequest,
  type FriendsListItem,
} from '../utils/friendsListData';
import { goBackOrReplace } from '@/lib/navigation';
import { LoggingPage } from '@/components/LoggingPage';
import { trackButtonClick } from '@/lib/analytics';
import { fontFamily } from '@/lib/token/primitive/fonts';
import defaultSmallAvatar from '@assets/avatars/default-small.svg';
import defaultAvatar from '@assets/avatars/default.svg';
import appsIcon from '@assets/icons/apps.svg';
import backIcon from '@assets/icons/back.svg';
import closeIcon from '@assets/icons/close.svg';
import exportIcon from '@assets/icons/export.svg';
import feedIcon from '@assets/icons/feed.svg';
import meIcon from '@assets/icons/me.svg';
import searchIcon from '@assets/icons/search.svg';
import shareIcon from '@assets/icons/share.svg';

const { regular, medium, bold } = fontFamily.primary;
const green = '#5a8974';

const share = () => Alert.alert('친구 초대', '친구 초대 링크는 준비 중이에요.');

function Avatar({ uri, small = false }: { uri?: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <Image
      source={uri && !failed ? { uri } : small ? defaultSmallAvatar : defaultAvatar}
      style={{ width: small ? 32 : 60, height: small ? 32 : 60, borderRadius: 999 }}
      contentFit="cover"
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

function ShareButton() {
  return (
    <Pressable accessibilityRole="button" onPress={share} style={styles.shareButton}>
      <Image source={shareIcon} style={styles.shareIcon} contentFit="contain" />
      <Text style={styles.shareText}>프로필 공유하기</Text>
    </Pressable>
  );
}

function UserLabel({ user }: { user: FriendsListItem['user'] }) {
  return (
    <View style={styles.userLabel}>
      <Text numberOfLines={1} style={styles.userName}>
        {user.displayName}
      </Text>
      {user.email ? (
        <Text numberOfLines={1} style={styles.email}>
          {user.email}
        </Text>
      ) : null}
    </View>
  );
}

function CloseButton({
  label,
  disabled,
  onPress,
  received = false,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  received?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ left: 11, right: 11 }}
      style={[
        styles.closeButton,
        received && styles.receivedCloseButton,
        disabled && styles.disabled,
      ]}
    >
      <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" />
    </Pressable>
  );
}

function ReceivedRequestsSection({
  pendingActionId,
  onAccept,
  onReject,
}: {
  pendingActionId: string | null;
  onAccept: (id: number) => Promise<boolean>;
  onReject: (id: number) => Promise<boolean>;
}) {
  const result = useSuspenseQuery(getGetReceivedRequestsSuspenseQueryOptions());
  const receivedRequests = result.data.map(toReceivedRequest);
  const busy = pendingActionId !== null;
  return (
    <>
      {result.error ? (
        <FriendsErrorFeedback
          error={result.error}
          onRetry={() => {
            void result.refetch();
          }}
        />
      ) : null}
      {receivedRequests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>받은 요청 ({receivedRequests.length})</Text>
          <View style={styles.rows}>
            {receivedRequests.map((request) => (
              <View key={request.requestId} style={styles.row}>
                <Avatar uri={request.user.profileImageUrl} />
                <UserLabel user={request.user} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${request.user.displayName} 친구 요청 수락`}
                  accessibilityState={{
                    disabled: busy,
                    busy: pendingActionId === `request:${request.requestId}`,
                  }}
                  disabled={busy}
                  hitSlop={{ top: 6, bottom: 6 }}
                  onPress={() => {
                    void onAccept(request.requestId);
                  }}
                  style={[styles.acceptButton, busy && styles.disabled]}
                >
                  {pendingActionId === `request:${request.requestId}` ? (
                    <ActivityIndicator size="small" color={green} />
                  ) : (
                    <Text style={styles.acceptText}>수락</Text>
                  )}
                </Pressable>
                <CloseButton
                  label={`${request.user.displayName} 친구 요청 거절`}
                  disabled={busy}
                  received
                  onPress={() => {
                    void onReject(request.requestId);
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function FriendsSection({
  userId,
  query,
  pendingActionId,
  onSelectDelete,
}: {
  userId?: number;
  query: string;
  pendingActionId: string | null;
  onSelectDelete: (friend: FriendsListItem) => void;
}) {
  const result = useSuspenseQuery(getGetFriendsSuspenseQueryOptions());
  const friends = result.data.map(toFriendListItem);
  const busy = pendingActionId !== null;
  const searching = query.trim().length > 0;
  const filteredFriends =
    userId != null
      ? friends.filter((item) => item.user.userId === userId)
      : filterFriendsByName(friends, query);
  if (userId != null && filteredFriends.length === 0 && result.isFetching) {
    return (
      <ActivityIndicator
        color={green}
        style={{ padding: 24 }}
        accessibilityLabel="친구 정보 불러오는 중"
      />
    );
  }
  return (
    <>
      {result.error ? (
        <FriendsErrorFeedback
          error={result.error}
          onRetry={() => {
            void result.refetch();
          }}
        />
      ) : null}
      {filteredFriends.length > 0 ? (
        <View style={[styles.section, searching && styles.searchSection]}>
          <Text style={styles.sectionTitle}>내 친구</Text>
          <View style={styles.rows}>
            {filteredFriends.map((friend) => (
              <View key={friend.friendshipId} style={styles.row}>
                <Avatar uri={friend.user.profileImageUrl} />
                <UserLabel user={friend.user} />
                <CloseButton
                  label={`${friend.user.displayName} 친구 삭제`}
                  disabled={busy}
                  onPress={() => {
                    Keyboard.dismiss();
                    onSelectDelete(friend);
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      ) : searching ? (
        <View style={styles.searchEmpty}>
          <Text style={styles.emptyTitle}>일치하는 친구가 없어요.</Text>
          <Text style={styles.emptyDescription}>
            프로필을 공유하거나,{'\n'}친구의 메일을 입력해 친구를 추가해보세요.
          </Text>
          <ShareButton />
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.friendsEmpty}>
          <Text style={styles.emptyTitle}>아직 친구가 없어요.</Text>
          <Text style={styles.emptyDescription}>친구와 함께 디톡스를 시작해보세요.</Text>
        </View>
      ) : null}
    </>
  );
}

export default function FriendsScreen() {
  return (
    <LoggingPage eventName="Friends Viewed" properties={{ pageName: 'Friends' }}>
      <FriendsContent />
    </LoggingPage>
  );
}

function FriendsContent() {
  const {
    refreshing,
    error,
    pendingActionId,
    refresh,
    acceptRequest,
    rejectRequest,
    deleteFriend,
  } = useFriendsListController();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FriendsListItem | null>(null);
  const searching = query.trim().length > 0;
  const emailSearch = query.includes('@');
  const { email, valid } = useDebouncedEmail(query);
  const busy = pendingActionId !== null;
  const deleting =
    deleteTarget !== null && pendingActionId === `friend:${deleteTarget.friendshipId}`;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    const androidShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const androidHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
      androidShow.remove();
      androidHide.remove();
    };
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    if (await deleteFriend(deleteTarget.friendshipId)) setDeleteTarget(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            onPress={() => goBackOrReplace('/(group)/mypage')}
            style={styles.backButton}
            hitSlop={{ left: 10, right: 10 }}
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>친구 목록</Text>
        </View>
        <View style={styles.searchBox}>
          <Image source={searchIcon} style={styles.searchIcon} contentFit="contain" />
          <TextInput
            accessibilityLabel="친구 이름 또는 이메일 검색"
            placeholder="친구 추가 또는 검색"
            placeholderTextColor="#989fad"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            clearButtonMode="while-editing"
            testID="friends-search"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardVisible ? 24 : insets.bottom + 108 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColor={green}
          />
        }
      >
        {error ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void refresh();
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : null}
        {!searching ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="친구 초대 공유"
            onPress={share}
            style={styles.inviteCard}
          >
            <Avatar small />
            <View style={styles.inviteLabel}>
              <Text style={styles.inviteTitle}>친구 초대</Text>
              <Text numberOfLines={1} style={styles.inviteSubtitle}>
                초대 링크 준비 중
              </Text>
            </View>
            <Image source={exportIcon} style={styles.exportIcon} contentFit="contain" />
          </Pressable>
        ) : null}

        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={async () => {
                await refresh();
                reset();
              }}
            >
              <Suspense
                fallback={
                  <ActivityIndicator
                    color={green}
                    style={{ padding: 24 }}
                    accessibilityLabel="친구 목록 불러오는 중"
                  />
                }
              >
                {!searching ? (
                  <ReceivedRequestsSection
                    pendingActionId={pendingActionId}
                    onAccept={acceptRequest}
                    onReject={rejectRequest}
                  />
                ) : null}

                {emailSearch ? (
                  email ? (
                    <FriendEmailSearch
                      key={email}
                      email={email}
                      onRefresh={refresh}
                      onReceived={() => {
                        trackButtonClick(
                          'Friends Received Requests Open Clicked',
                          'Friends',
                          '받은 요청 확인'
                        );
                        setQuery('');
                        Keyboard.dismiss();
                      }}
                      renderFriend={(userId) => (
                        <FriendsSection
                          userId={userId}
                          query={query}
                          pendingActionId={pendingActionId}
                          onSelectDelete={setDeleteTarget}
                        />
                      )}
                      empty={
                        <View style={styles.searchEmpty}>
                          <Text style={styles.emptyTitle}>일치하는 메일이 없어요.</Text>
                          <Text style={styles.emptyDescription}>
                            프로필을 공유해서 초대해보세요.
                          </Text>
                          <ShareButton />
                        </View>
                      }
                    />
                  ) : valid ? (
                    <ActivityIndicator
                      style={{ padding: 24 }}
                      color={green}
                      accessibilityLabel="이메일 검색 중"
                    />
                  ) : (
                    <Text style={styles.emailHint}>친구의 전체 이메일 주소를 입력해주세요.</Text>
                  )
                ) : (
                  <FriendsSection
                    query={query}
                    pendingActionId={pendingActionId}
                    onSelectDelete={setDeleteTarget}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>

        {!searching ? (
          <View style={styles.shareFooter}>
            <Text style={styles.emptyTitle}>친구를 찾을 수 없나요?</Text>
            <Text style={styles.footerDescription}>
              프로필을 공유해서 디톡스메이트에서{'\n'}추가할 수 있게 해주세요.
            </Text>
            <ShareButton />
          </View>
        ) : null}
      </ScrollView>

      {!keyboardVisible ? (
        <View style={[styles.navigationWrap, { bottom: Math.max(insets.bottom - 10, 16) }]}>
          <View style={styles.navigation}>
            {(
              [
                { label: '피드', icon: feedIcon, route: '/(feed)/home' },
                { label: '제한 앱', icon: appsIcon, route: '/(lock)/restricted-apps' },
                { label: '마이페이지', icon: meIcon, route: '/(group)/mypage' },
              ] as const
            ).map((tab) => (
              <Pressable
                key={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab.label === '마이페이지' }}
                onPress={() => router.replace(tab.route)}
                style={[styles.tab, tab.label === '마이페이지' && styles.activeTab]}
              >
                <Image source={tab.icon} style={styles.tabIcon} contentFit="contain" />
                <Text style={styles.tabLabel}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!busy) setDeleteTarget(null);
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="친구 삭제 취소"
            accessibilityRole="button"
            style={styles.backdrop}
            disabled={busy}
            onPress={() => setDeleteTarget(null)}
          />
          <View
            accessibilityViewIsModal
            style={[styles.sheet, { marginBottom: Math.max(insets.bottom + 2, 20) }]}
          >
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
            <View style={styles.sheetContent}>
              <Avatar uri={deleteTarget?.user.profileImageUrl} />
              <Text style={styles.deleteDescription}>
                <Text style={styles.deleteName}>{deleteTarget?.user.displayName}</Text> 님의 활동을
                더 이상 볼 수 없게 되며,{'\n'}본인의 활동도 표시되지 않게 됩니다.
              </Text>
              {error ? (
                <Text accessibilityLiveRegion="polite" style={styles.sheetError}>
                  {error}
                </Text>
              ) : null}
              <View style={styles.sheetButtons}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy, busy: deleting }}
                  disabled={busy}
                  onPress={() => {
                    void confirmDelete();
                  }}
                  style={[styles.deleteButton, busy && styles.disabled]}
                >
                  {deleting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.deleteButtonText}>친구 삭제</Text>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  accessibilityState={{ disabled: busy }}
                  onPress={() => setDeleteTarget(null)}
                  style={[styles.cancelButton, busy && styles.disabled]}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  emailHint: {
    fontFamily: regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#989fad',
    textAlign: 'center',
    padding: 24,
  },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  backButton: { width: 24, height: 44, justifyContent: 'center' },
  backIcon: { width: 24, height: 24 },
  headerTitle: { fontFamily: medium, fontSize: 20, lineHeight: 28, color: '#383e49' },
  searchBox: {
    marginTop: 16,
    marginHorizontal: 17,
    marginBottom: 23,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#f0f1f3',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchIcon: { width: 18, height: 18 },
  searchInput: {
    flex: 1,
    fontFamily: regular,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
    color: '#383e49',
    letterSpacing: -0.32,
    height: 40,
  },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  inviteCard: {
    marginHorizontal: 16,
    height: 68,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d0d3d9',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteLabel: { flex: 1 },
  inviteTitle: { fontFamily: bold, fontSize: 16, lineHeight: 24, color: 'black' },
  inviteSubtitle: {
    fontFamily: regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#989fad',
    marginTop: -6,
  },
  exportIcon: { width: 23, height: 23 },
  section: { marginTop: 23 },
  searchSection: { marginTop: 0 },
  sectionTitle: {
    fontFamily: medium,
    fontSize: 14,
    lineHeight: 20,
    color: 'black',
    marginHorizontal: 16,
    marginBottom: 17,
  },
  rows: { gap: 15 },
  row: { minHeight: 60, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  userLabel: { flex: 1, minWidth: 0 },
  userName: { fontFamily: medium, fontSize: 16, lineHeight: 26, color: '#2b2f38' },
  email: { fontFamily: regular, fontSize: 16, lineHeight: 26, color: '#989fad', marginTop: -4 },
  closeButton: { width: 22, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  receivedCloseButton: { marginLeft: 5 },
  closeIcon: { width: 22, height: 22 },
  acceptButton: {
    minWidth: 48,
    minHeight: 33,
    borderRadius: 999,
    backgroundColor: '#f0f1f3',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontFamily: bold,
    fontSize: 14,
    lineHeight: 21,
    color: '#383e49',
    letterSpacing: -0.28,
  },
  shareFooter: { alignItems: 'center', marginTop: 48, gap: 10 },
  emptyTitle: {
    fontFamily: regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'black',
    textAlign: 'center',
  },
  footerDescription: {
    fontFamily: regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#989fad',
    textAlign: 'center',
    marginTop: -3,
  },
  emptyDescription: {
    fontFamily: regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#989fad',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 10,
  },
  searchEmpty: { alignItems: 'center', marginTop: 25, paddingHorizontal: 16 },
  friendsEmpty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 16 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 999,
    backgroundColor: green,
  },
  shareIcon: { width: 14, height: 14 },
  shareText: {
    fontFamily: bold,
    fontSize: 14,
    lineHeight: 21,
    color: 'white',
    letterSpacing: -0.28,
  },
  navigationWrap: { position: 'absolute', alignSelf: 'center' },
  navigation: {
    width: 282,
    height: 61,
    borderRadius: 999,
    backgroundColor: '#f7f7f7',
    padding: 4,
    flexDirection: 'row',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, gap: 1 },
  activeTab: { backgroundColor: '#ededed' },
  tabIcon: { width: 26, height: 26 },
  tabLabel: {
    fontFamily: fontFamily.primary.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: '#2b2f38',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(74,74,74,0.48)' },
  sheet: {
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderRadius: 24,
    backgroundColor: 'white',
  },
  handleWrap: { height: 16, alignItems: 'center', paddingTop: 5 },
  handle: { width: 52, height: 5, borderRadius: 999, backgroundColor: '#d0d3d9' },
  sheetContent: { alignItems: 'center', paddingTop: 24, gap: 16 },
  deleteDescription: {
    fontFamily: regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
    textAlign: 'center',
  },
  deleteName: { color: '#2b2f38' },
  sheetButtons: { alignSelf: 'stretch', gap: 4 },
  deleteButton: {
    backgroundColor: green,
    borderRadius: 999,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontFamily: bold, fontSize: 16, lineHeight: 24, color: 'white' },
  cancelButton: {
    backgroundColor: '#d0d3d9',
    borderRadius: 999,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontFamily: bold, fontSize: 16, lineHeight: 24, color: '#383e49' },
  disabled: { opacity: 0.5 },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f1f3',
    gap: 4,
  },
  errorText: { fontFamily: regular, fontSize: 14, lineHeight: 20, color: '#383e49' },
  retryButton: { paddingVertical: 8, alignSelf: 'flex-start' },
  retryText: { fontFamily: bold, fontSize: 14, color: green },
  sheetError: {
    fontFamily: regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#b42318',
    textAlign: 'center',
  },
});
