import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  filterFriendsByName,
  type FriendReceivedRequest,
  type FriendsListItem,
} from '../utils/friendsListData';
import { goBackOrReplace } from '@/lib/navigation';
import { fontFamily } from '@/lib/token/primitive/fonts';

const assets = {
  avatar: require('../../../../assets/avatars/default.svg'),
  avatarSmall: require('../../../../assets/avatars/default-small.svg'),
  back: require('../../../../assets/icons/back.svg'),
  search: require('../../../../assets/icons/search.svg'),
  share: require('../../../../assets/icons/share.svg'),
  export: require('../../../../assets/icons/export.svg'),
  close: require('../../../../assets/icons/close.svg'),
  feed: require('../../../../assets/icons/feed.svg'),
  apps: require('../../../../assets/icons/apps.svg'),
  me: require('../../../../assets/icons/me.svg'),
};
const { regular, medium, bold } = fontFamily.primary;
const green = '#5a8974';

export interface FriendsListViewProps {
  friends?: FriendsListItem[];
  receivedRequests?: FriendReceivedRequest[];
  loading?: boolean;
  renderFriends?: (query: string, onSelectDelete: (friend: FriendsListItem) => void) => ReactNode;
  renderReceived?: (onConfirmAccept: (request: FriendReceivedRequest) => void) => ReactNode;
  refreshing: boolean;
  error: string | null;
  pendingActionId: string | null;
  onRefresh: () => Promise<void>;
  onAccept: (requestId: number) => Promise<boolean>;
  onReject: (requestId: number) => Promise<boolean>;
  onDelete: (friendshipId: number) => Promise<boolean>;
  onShare: () => void;
  inviteSecondaryText?: string;
  initialQuery?: string;
  initialDeleteFriendId?: number;
  autoFocusSearch?: boolean;
}

function Avatar({ uri, small = false }: { uri?: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <Image
      source={uri && !failed ? { uri } : small ? assets.avatarSmall : assets.avatar}
      style={{ width: small ? 32 : 60, height: small ? 32 : 60, borderRadius: 999 }}
      contentFit="cover"
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

function ShareButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.shareButton}>
      <Image source={assets.share} style={styles.shareIcon} contentFit="contain" />
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
      <Image source={assets.close} style={styles.closeIcon} contentFit="contain" />
    </Pressable>
  );
}

export function ReceivedRequestsSection({
  receivedRequests,
  pendingActionId,
  onConfirmAccept,
  onReject,
}: {
  receivedRequests: FriendReceivedRequest[];
  pendingActionId: string | null;
  onConfirmAccept: (request: FriendReceivedRequest) => void;
  onReject: (id: number) => Promise<boolean>;
}) {
  const busy = pendingActionId !== null;
  if (!receivedRequests.length) return null;
  return (
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
              onPress={() => onConfirmAccept(request)}
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
  );
}

export function FriendsSection({
  friends,
  query,
  pendingActionId,
  onSelectDelete,
  onShare,
}: {
  friends: FriendsListItem[];
  query: string;
  pendingActionId: string | null;
  onSelectDelete: (friend: FriendsListItem) => void;
  onShare: () => void;
}) {
  const busy = pendingActionId !== null;
  const searching = query.trim().length > 0;
  const emailSearch = query.includes('@');
  const filteredFriends = emailSearch ? [] : filterFriendsByName(friends, query);
  return filteredFriends.length > 0 ? (
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
      <Text style={styles.emptyTitle}>
        {emailSearch ? '이메일로 친구 추가는 준비 중이에요.' : '일치하는 친구가 없어요.'}
      </Text>
      <Text style={styles.emptyDescription}>
        {emailSearch
          ? '친구 추가 화면에서 제공할 예정이에요.'
          : '프로필을 공유하거나,\n친구의 메일을 입력해 친구를 추가해보세요.'}
      </Text>
      <ShareButton onPress={onShare} />
    </View>
  ) : friends.length === 0 ? (
    <View style={styles.friendsEmpty}>
      <Text style={styles.emptyTitle}>아직 친구가 없어요.</Text>
      <Text style={styles.emptyDescription}>친구와 함께 디톡스를 시작해보세요.</Text>
    </View>
  ) : null;
}

export function FriendsListView({
  friends = [],
  receivedRequests = [],
  loading = false,
  renderFriends,
  renderReceived,
  refreshing,
  error,
  pendingActionId,
  onRefresh,
  onAccept,
  onReject,
  onDelete,
  onShare,
  inviteSecondaryText = '초대 링크 준비 중',
  initialQuery = '',
  initialDeleteFriendId,
  autoFocusSearch = false,
}: FriendsListViewProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FriendsListItem | null>(
    () => friends.find((friend) => friend.friendshipId === initialDeleteFriendId) ?? null
  );
  const initializedDeleteTarget = useRef(initialDeleteFriendId == null || deleteTarget !== null);
  const searching = query.trim().length > 0;
  const busy = pendingActionId !== null;
  const failedInitialRead =
    !renderFriends &&
    !renderReceived &&
    error !== null &&
    friends.length === 0 &&
    receivedRequests.length === 0;
  const deleting =
    deleteTarget !== null && pendingActionId === `friend:${deleteTarget.friendshipId}`;

  useEffect(() => {
    if (initializedDeleteTarget.current || loading) return;
    initializedDeleteTarget.current = true;
    setDeleteTarget(
      friends.find((friend) => friend.friendshipId === initialDeleteFriendId) ?? null
    );
  }, [friends, initialDeleteFriendId, loading]);

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

  const confirmAccept = (request: FriendReceivedRequest) => {
    if (busy) return;
    Alert.alert(
      '친구 요청 수락',
      `${request.user.displayName}님과 친구가 되면 지금까지의 모든 활동 기록을 서로 볼 수 있어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: () => {
            void onAccept(request.requestId);
          },
        },
      ]
    );
  };
  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    if (await onDelete(deleteTarget.friendshipId)) setDeleteTarget(null);
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
            <Image source={assets.back} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>친구 목록</Text>
        </View>
        <View style={styles.searchBox}>
          <Image source={assets.search} style={styles.searchIcon} contentFit="contain" />
          <TextInput
            accessibilityLabel="친구 이름 검색"
            placeholder="친구 추가 또는 검색"
            placeholderTextColor="#989fad"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoFocus={autoFocusSearch}
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
              void onRefresh();
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
                void onRefresh();
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : null}
        {loading ? (
          <ActivityIndicator
            color={green}
            style={styles.loading}
            accessibilityLabel="친구 목록 불러오는 중"
          />
        ) : failedInitialRead ? null : (
          <>
            {!searching ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="친구 초대 공유"
                onPress={onShare}
                style={styles.inviteCard}
              >
                <Avatar small />
                <View style={styles.inviteLabel}>
                  <Text style={styles.inviteTitle}>친구 초대</Text>
                  <Text numberOfLines={1} style={styles.inviteSubtitle}>
                    {inviteSecondaryText}
                  </Text>
                </View>
                <Image source={assets.export} style={styles.exportIcon} contentFit="contain" />
              </Pressable>
            ) : null}

            {!searching ? (
              renderReceived ? (
                renderReceived(confirmAccept)
              ) : (
                <ReceivedRequestsSection
                  receivedRequests={receivedRequests}
                  pendingActionId={pendingActionId}
                  onConfirmAccept={confirmAccept}
                  onReject={onReject}
                />
              )
            ) : null}

            {renderFriends ? (
              renderFriends(query, setDeleteTarget)
            ) : (
              <FriendsSection
                friends={friends}
                query={query}
                pendingActionId={pendingActionId}
                onSelectDelete={setDeleteTarget}
                onShare={onShare}
              />
            )}

            {!searching ? (
              <View
                style={[
                  styles.shareFooter,
                  !renderReceived && receivedRequests.length === 0 && styles.baseFooter,
                ]}
              >
                <Text style={styles.emptyTitle}>친구를 찾을 수 없나요?</Text>
                <Text style={styles.footerDescription}>
                  프로필을 공유해서 디톡스메이트에서{'\n'}추가할 수 있게 해주세요.
                </Text>
                <ShareButton onPress={onShare} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {!keyboardVisible ? (
        <View style={[styles.navigationWrap, { bottom: Math.max(insets.bottom - 10, 16) }]}>
          <View style={styles.navigation}>
            {(
              [
                { label: '피드', icon: assets.feed, route: '/(feed)/home' },
                { label: '제한 앱', icon: assets.apps, route: '/(lock)/restricted-apps' },
                { label: '마이페이지', icon: assets.me, route: '/(group)/mypage' },
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
  baseFooter: { marginTop: 58 },
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
  loading: { paddingTop: 48 },
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
