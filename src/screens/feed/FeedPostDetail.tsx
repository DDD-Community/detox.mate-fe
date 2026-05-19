import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { pokeStore } from '../../lib/pokeStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';
import type { FeedItem, PokeEntry, ReactionEntry } from './FeedCard';

const { gray, green, brown, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SOURCE = require('../../../assets/basic-profile-turtle-hi.png');
const REACTION_EMOJIS = ['👍', '🔥', '💪', '🐢', '🥹'] as const;
const EMOJI_TO_CODE: Record<string, string> = {
  '👍': 'THUMBSUP',
  '🔥': 'FIGHTING',
  '💪': 'MUSCLE',
  '🐢': 'TURTLE',
  '🥹': 'GLOOMY',
};

type CommentItem = {
  id: string;
  authorName: string;
  avatarSource: number | { uri: string };
  text: string;
  createdAt: number;
  timeAgoLabel: string;
};

type CommentAPIItem = {
  commentId: number;
  author: { userId: number; displayName: string; profileImageUrl: string; isUserWithdrawn: boolean };
  commentBody: string;
  createdAt: string;
};

type CommentsResponse = {
  totalCount: number;
  items: CommentAPIItem[];
  nextCursor: string | null;
};

type ReactionSummaryItem = {
  reactionBody: string;
  userId: number;
  displayName: string;
  profileImageUrl: string;
  isUserWithdrawn: boolean;
};

type PokedUser = {
  userId: number;
  displayName: string;
  profileImageUrl: string;
};

type DetailResponse = {
  challengeRecordId: number;
  reactionCount: number;
  commentCount: number;
  reactions: { totalCount: number; summary: ReactionSummaryItem[] };
  pokedUsers: PokedUser[];
};

const CODE_TO_EMOJI: Record<string, string> = {
  THUMBSUP: '👍',
  FIGHTING: '🔥',
  MUSCLE: '💪',
  TURTLE: '🐢',
  GLOOMY: '🥹',
};

export const MOCK_COMMENTS: CommentItem[] = [];

const BODY_TEXT: Record<GoalState, string> = {
  notSet: '개인 목표를 설정해야 해요',
  setWaiting: '내일부터 인증 가능해요',
  authReady: '아직 인증하지 않았어요',
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function FeedPostDetail() {
  const {
    item: itemJson,
    goalState,
    isPoked: isPokedParam,
    myReaction,
    groupChallengeId,
  } = useLocalSearchParams<{
    item: string;
    goalState: GoalState;
    isPoked: string;
    myReaction: string;
    groupChallengeId: string;
  }>();

  const insets = useSafeAreaInsets();
  const feedItem = JSON.parse(itemJson as string) as FeedItem;
  const state: GoalState = goalState ?? 'authReady';

  const ownInList = new Set(
    (feedItem.reactions ?? []).filter((r) => r.userId === 'me').map((r) => r.emoji)
  );
  const paramEmojis = myReaction ? myReaction.split(',').filter(Boolean) : [];
  const ownEntry: ReactionEntry[] = paramEmojis
    .filter((emoji) => !ownInList.has(emoji))
    .map((emoji) => ({ userId: 'me', name: '나', avatarSource: AVATAR_SOURCE as number, emoji }));

  const [isPoked, setIsPoked] = useState(isPokedParam === '1');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [reactions, setReactions] = useState<ReactionEntry[]>([
    ...ownEntry,
    ...(feedItem.reactions ?? []),
  ]);
  const [reactionCount, setReactionCount] = useState(feedItem.reactionCount);
  const [commentCount, setCommentCount] = useState(feedItem.commentCount);
  const [myReactionEmojis, setMyReactionEmojis] = useState<string[]>(paramEmojis);
  const [myReactionIds, setMyReactionIds] = useState<Record<string, number>>({});
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [fetchedPokes, setFetchedPokes] = useState<PokeEntry[]>([]);

  useEffect(() => {
    if (!feedItem.challengeRecordId) return;
    const fetchComments = async () => {
      try {
        const res = await apiClient.get<CommentsResponse>(
          `/challenge-records/${feedItem.challengeRecordId}/comments`
        );
        const mapped = res.data.items.map((c) => ({
          id: String(c.commentId),
          authorName: c.author.displayName,
          avatarSource: c.author.profileImageUrl
            ? { uri: c.author.profileImageUrl }
            : AVATAR_SOURCE,
          text: c.commentBody,
          createdAt: new Date(c.createdAt).getTime(),
          timeAgoLabel: formatTimeAgo(new Date(c.createdAt).getTime()),
        }));
        setComments(mapped);
        setCommentCount(res.data.totalCount);
      } catch {
        // keep existing state on error
      }
    };
    fetchComments();
  }, [feedItem.challengeRecordId]);

  useEffect(() => {
    if (!groupChallengeId || !feedItem.challengeRecordId) return;
    const fetchDetail = async () => {
      try {
        const res = await apiClient.get<DetailResponse>(
          `/group-challenges/${groupChallengeId}/challenge-records/${feedItem.challengeRecordId}`
        );
        const serverReactions: ReactionEntry[] = res.data.reactions.summary.map((r) => ({
          userId: String(r.userId),
          name: r.displayName,
          avatarSource: r.profileImageUrl ? { uri: r.profileImageUrl } : (AVATAR_SOURCE as number),
          emoji: CODE_TO_EMOJI[r.reactionBody] ?? r.reactionBody,
        }));
        // Merge: keep any optimistic 'me' entries, replace server entries
        setReactions((prev) => {
          const myOptimistic = prev.filter((r) => r.userId === 'me');
          return [...myOptimistic, ...serverReactions];
        });
        setReactionCount(res.data.reactionCount);

        const mappedPokes: PokeEntry[] = res.data.pokedUsers.map((u) => ({
          userId: String(u.userId),
          name: u.displayName,
          avatarSource: u.profileImageUrl ? { uri: u.profileImageUrl } : (AVATAR_SOURCE as number),
        }));
        // Note: pokes are stored in feedItem, but we can update displayPokes from detail
        // Currently displayPokes is derived from feedItem.pokes which is [] from API
        // Store fetched pokes in a ref-like state via a local variable (used in render below)
        setFetchedPokes(mappedPokes);
      } catch {
        // keep existing state on error
      }
    };
    fetchDetail();
  }, [groupChallengeId, feedItem.challengeRecordId]);

  const displayPokes: PokeEntry[] = fetchedPokes.length > 0 ? fetchedPokes : (feedItem.pokes ?? []);
  const sortedComments = [...comments].sort((a, b) => a.createdAt - b.createdAt);

  const handleReact = async (emoji: string) => {
    const hasThis = myReactionEmojis.includes(emoji);
    if (hasThis) {
      setReactions((prev) => prev.filter((r) => !(r.userId === 'me' && r.emoji === emoji)));
      setMyReactionEmojis((prev) => prev.filter((e) => e !== emoji));
      setReactionCount((prev) => Math.max(0, prev - 1));
      if (!feedItem.challengeRecordId) return;
      const reactionId = myReactionIds[emoji];
      if (!reactionId) return;
      try {
        await apiClient.delete(
          `/challenge-records/${feedItem.challengeRecordId}/reactions/${reactionId}`
        );
        setMyReactionIds((prev) => {
          const copy = { ...prev };
          delete copy[emoji];
          return copy;
        });
      } catch {}
    } else {
      const entry: ReactionEntry = {
        userId: 'me',
        name: '나',
        avatarSource: AVATAR_SOURCE as number,
        emoji,
      };
      setReactions((prev) => [entry, ...prev]);
      setMyReactionEmojis((prev) => [...prev, emoji]);
      setReactionCount((prev) => prev + 1);
      if (!feedItem.challengeRecordId) return;
      const reactionCode = EMOJI_TO_CODE[emoji];
      if (!reactionCode) return;
      try {
        const res = await apiClient.post<{ reactionId: number }>(
          `/challenge-records/${feedItem.challengeRecordId}/reactions`,
          { reactionCode }
        );
        setMyReactionIds((prev) => ({ ...prev, [emoji]: res.data.reactionId }));
      } catch {}
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText('');
    const newComment: CommentItem = {
      id: String(Date.now()),
      authorName: '나',
      avatarSource: AVATAR_SOURCE as number,
      text,
      createdAt: Date.now(),
      timeAgoLabel: '방금 전',
    };
    setComments((prev) => [...prev, newComment]);
    setCommentCount((prev) => prev + 1);
    if (!feedItem.challengeRecordId) return;
    try {
      await apiClient.post(
        `/challenge-records/${feedItem.challengeRecordId}/comments`,
        { commentBody: text }
      );
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={require('../../../assets/icons/regular/icon_rg_CaretLeft.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={styles.headerTitle}>게시물</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {feedItem.isVerified ? (
            <>
              <View style={styles.verifiedHeader}>
                <View style={styles.avatarWithLabel}>
                  <Image source={feedItem.avatarSource} style={styles.avatar} resizeMode="cover" />
                  <View style={styles.statusLabelAnchor}>
                    <View
                      style={[
                        styles.statusLabel,
                        { backgroundColor: feedItem.isGoalAchieved ? green[300] : gray[400] },
                      ]}
                    >
                      <Text style={styles.statusLabelText}>
                        {feedItem.isGoalAchieved ? '목표 성공' : '목표 실패'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.memberName, { flex: 1 }]}>{feedItem.name}</Text>
                {feedItem.verifiedTimeAgo != null && (
                  <Text style={styles.timeAgo}>{feedItem.verifiedTimeAgo}</Text>
                )}
              </View>

              {feedItem.isGoalAchieved ? (
                <>
                  {feedItem.photoSource != null && (
                    <Image source={feedItem.photoSource} style={styles.photo} resizeMode="cover" />
                  )}
                  {feedItem.postText != null && (
                    <Text style={styles.postText}>{feedItem.postText}</Text>
                  )}
                </>
              ) : (
                <View style={styles.retroCard}>
                  <Text style={styles.retroLabel}>한 줄 회고</Text>
                  <Text style={styles.retroText}>{feedItem.retroText}</Text>
                </View>
              )}

              {feedItem.screenTime != null && (
                <View
                  style={[
                    styles.screentimeRow,
                    {
                      backgroundColor: feedItem.isGoalAchieved ? system.green.opacity10 : gray[50],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.screentimeLabel,
                      !feedItem.isGoalAchieved && { color: gray[500] },
                    ]}
                  >
                    스크린타임
                  </Text>
                  <Text
                    style={[
                      styles.screentimeValue,
                      !feedItem.isGoalAchieved && { color: gray[500] },
                    ]}
                  >
                    {feedItem.screenTime}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.memberRow}>
                <Image source={feedItem.avatarSource} style={styles.avatar} resizeMode="cover" />
                <Text style={styles.memberName}>{feedItem.name}</Text>
              </View>

              <Text style={styles.statusText}>{BODY_TEXT[state]}</Text>

              {!feedItem.isMe && state !== 'setWaiting' && (
                <Pressable
                  style={[styles.pokeButton, isPoked && styles.pokeButtonDisabled]}
                  disabled={isPoked}
                  onPress={() => {
                    Alert.alert(`${feedItem.name}님을 콕 찔렀어요!`);
                    pokeStore.add(feedItem.id);
                    setIsPoked(true);
                  }}
                >
                  <Text>👉</Text>
                  <Text style={[styles.pokeButtonText, isPoked && styles.pokeButtonTextDisabled]}>
                    콕 찌르기
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {feedItem.isVerified ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>리액션 {reactionCount}</Text>
            {reactions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pokeRow}
              >
                {reactions.map((r) => (
                  <View key={`${r.userId}-${r.emoji}`} style={styles.pokeAvatarItem}>
                    <View style={styles.pokeAvatarWrapper}>
                      <Image source={r.avatarSource} style={styles.pokeAvatar} resizeMode="cover" />
                      <View style={styles.pokeEmoji}>
                        <Text style={styles.pokeEmojiText}>{r.emoji}</Text>
                      </View>
                    </View>
                    <Text style={styles.pokeAvatarName}>{r.name}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>콕 찌름 {feedItem.pokeCount}</Text>
            {displayPokes.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pokeRow}
              >
                {displayPokes.map((p) => (
                  <View key={p.userId} style={styles.pokeAvatarItem}>
                    <View style={styles.pokeAvatarWrapper}>
                      <Image source={p.avatarSource} style={styles.pokeAvatar} resizeMode="cover" />
                      <View style={styles.pokeEmoji}>
                        <Text style={styles.pokeEmojiText}>👉</Text>
                      </View>
                    </View>
                    <Text style={styles.pokeAvatarName}>{p.name}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>댓글 {commentCount}</Text>
          {sortedComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Image
                source={comment.avatarSource}
                style={styles.commentAvatar}
                resizeMode="cover"
              />
              <View style={styles.commentContent}>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentTime}>{comment.timeAgoLabel}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {state === 'authReady' && (showReactionPicker ? (
        <View style={[styles.pickerBar, { paddingBottom: Math.max(insets.bottom, spacing[12]) }]}>
          <Pressable style={styles.pickerCountCircle} onPress={() => setShowReactionPicker(false)}>
            <Text style={styles.pickerCountText}>{reactions.length}</Text>
          </Pressable>
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              style={[
                styles.pickerEmojiBtn,
                myReactionEmojis.includes(emoji) && styles.pickerEmojiBtnActive,
              ]}
              onPress={() => {
                handleReact(emoji);
                setShowReactionPicker(false);
              }}
            >
              <Text style={styles.pickerEmojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing[12]) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="응원 메시지를 남겨보세요"
            placeholderTextColor={gray[400]}
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />

          {commentText.trim().length > 0 ? (
            <Pressable style={styles.sendBtn} onPress={handleSendComment}>
              <Image
                source={require('../../../assets/icons/regular/icon_rg_PaperPlaneRight.png')}
                style={styles.sendIcon}
                resizeMode="contain"
                tintColor={WHITE}
              />
            </Pressable>
          ) : (
            <Pressable style={styles.impressionBtn} onPress={() => setShowReactionPicker(true)}>
              <Image
                source={require('../../../assets/impressions.png')}
                style={styles.impressionIcon}
                resizeMode="contain"
                tintColor={WHITE}
              />
            </Pressable>
          )}
        </View>
      ))}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[56],
    paddingBottom: spacing[12],
    gap: spacing[8],
    backgroundColor: brown[50],
  },
  backButton: {
    padding: spacing[4],
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    ...typography.primary.body1B,
    color: gray[900],
  },
  content: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
    gap: spacing[12],
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: radius[16],
    padding: spacing[16],
    gap: spacing[24],
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  avatarWithLabel: {
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  statusLabelAnchor: {
    position: 'absolute',
    bottom: -spacing[8],
    left: -24,
    right: -24,
    alignItems: 'center',
  },
  statusLabel: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
  },
  statusLabelText: {
    ...typography.primary.caption2,
    color: WHITE,
  },
  memberName: {
    ...typography.primary.body2B,
    color: gray[900],
  },
  timeAgo: {
    ...typography.primary.caption,
    color: gray[400],
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: radius[8],
    marginTop: 2,
  },
  postText: {
    ...typography.primary.body2R,
    color: gray[900],
  },
  retroCard: {
    backgroundColor: system.red.opacity10,
    borderRadius: radius[8],
    padding: spacing[12],
    gap: spacing[4],
  },
  retroLabel: {
    ...typography.primary.body3B,
    color: system.red.opacity100,
  },
  retroText: {
    ...typography.primary.body2R,
    color: gray[700],
  },
  screentimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[16],
  },
  screentimeLabel: {
    ...typography.primary.body3R,
    color: system.green.opacity100,
  },
  screentimeValue: {
    ...typography.primary.body3B,
    color: system.green.opacity100,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  statusText: {
    ...typography.primary.body2R,
    color: gray[500],
    textAlign: 'center',
  },
  pokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: green[300],
    borderRadius: radius.full,
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
    gap: spacing[4],
  },
  pokeButtonText: {
    ...typography.primary.body2B,
    color: WHITE,
  },
  pokeButtonDisabled: {
    backgroundColor: gray[200],
  },
  pokeButtonTextDisabled: {
    color: gray[400],
  },
  section: {
    backgroundColor: WHITE,
    borderRadius: radius[16],
    padding: spacing[16],
    gap: spacing[12],
  },
  sectionTitle: {
    ...typography.primary.body2B,
    color: gray[900],
  },
  pokeRow: {
    flexDirection: 'row',
    gap: spacing[16],
  },
  pokeAvatarItem: {
    alignItems: 'center',
    gap: spacing[4],
  },
  pokeAvatarWrapper: {
    width: 52,
    height: 52,
  },
  pokeAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
  },
  pokeEmoji: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeEmojiText: {
    fontSize: 12,
  },
  pokeAvatarName: {
    ...typography.primary.body3R,
    color: gray[700],
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[8],
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    gap: spacing[2],
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  commentAuthor: {
    ...typography.primary.body3B,
    color: gray[900],
  },
  commentTime: {
    ...typography.primary.caption,
    color: gray[400],
  },
  commentText: {
    ...typography.primary.body3R,
    color: gray[700],
  },
  // Bottom input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[12],
    gap: spacing[8],
    backgroundColor: WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: gray[200],
  },
  impressionBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  impressionIcon: {
    width: 20,
    height: 20,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: gray[50],
    borderRadius: radius.full,
    paddingHorizontal: spacing[16],
    ...typography.primary.body3R,
    color: gray[900],
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    width: 20,
    height: 20,
  },
  // Reaction picker bar
  pickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[20],
    paddingTop: spacing[12],
    gap: spacing[12],
    backgroundColor: WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: gray[200],
  },
  pickerCountCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCountText: {
    ...typography.primary.body2B,
    color: WHITE,
  },
  pickerEmojiBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerEmojiBtnActive: {
    backgroundColor: gray[100],
  },
  pickerEmojiText: {
    fontSize: 24,
  },
});
