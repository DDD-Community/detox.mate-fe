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
import { Icon } from '../../components/Icon';
import { memberStore } from '../../lib/memberStore';
import { pokeStore } from '../../lib/pokeStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';
import type { FeedItem, PokeEntry, ReactionEntry } from './FeedCard';
import ReactionPicker, {
  getReactionSource,
  isSameReaction,
  normalizeReactionCode,
} from './ReactionPicker';

const { gray, green, brown, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SOURCE = require('../../../assets/basic-profile-turtle-hi.png');
const POCK_ICON = require('../../../assets/pock.png');
const IMPRESSION_ICON = require('../../../assets/feed_emotion.png');

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
  author: {
    userId: number;
    displayName: string;
    profileImageUrl: string;
    isUserWithdrawn: boolean;
  };
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

export const MOCK_COMMENTS: CommentItem[] = [];

const BODY_TEXT: Record<GoalState, string> = {
  notSet: '개인 목표를 설정해야 해요',
  setWaiting: '내일부터 인증 가능해요',
  authReady: '아직 인증하지 않았어요',
};

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

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
  const hasFailurePhoto =
    feedItem.isVerified === true && !feedItem.isGoalAchieved && feedItem.photoSource != null;
  const usesPostLayout = feedItem.isGoalAchieved || hasFailurePhoto;
  const postText = feedItem.postText ?? feedItem.retroText;
  const statusLabelColor = feedItem.isGoalAchieved
    ? system.green.opacity100
    : hasFailurePhoto
      ? system.red.opacity100
      : gray[400];
  const screentimeAccentColor = feedItem.isGoalAchieved
    ? system.green.opacity100
    : hasFailurePhoto
      ? system.red.opacity100
      : gray[500];
  const screentimeBackgroundColor = feedItem.isGoalAchieved
    ? system.green.opacity10
    : hasFailurePhoto
      ? system.red.opacity10
      : gray[50];

  const ownInList = (feedItem.reactions ?? [])
    .filter((r) => r.userId === 'me')
    .map((r) => normalizeReactionCode(r.emoji))
    .filter(Boolean);
  const paramEmojis = myReaction ? myReaction.split(',').filter(Boolean) : [];
  const ownEntry: ReactionEntry[] = paramEmojis
    .map((reaction) => normalizeReactionCode(reaction))
    .filter((reaction): reaction is NonNullable<typeof reaction> => !!reaction)
    .filter((reaction) => !ownInList.includes(reaction))
    .map((reaction) => ({
      userId: 'me',
      name: '나',
      avatarSource: AVATAR_SOURCE as number,
      emoji: reaction,
    }));

  const [isPoked, setIsPoked] = useState(isPokedParam === '1');
  const [pokeCount, setPokeCount] = useState(feedItem.pokeCount);
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
          emoji: normalizeReactionCode(r.reactionBody) ?? r.reactionBody,
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
        setFetchedPokes((prev) => {
          const myOptimistic = prev.filter((p) => p.userId === 'me');
          return [...myOptimistic, ...mappedPokes];
        });
      } catch {
        // keep existing state on error
      }
    };
    fetchDetail();
  }, [groupChallengeId, feedItem.challengeRecordId]);

  const displayPokes: PokeEntry[] = fetchedPokes.length > 0 ? fetchedPokes : (feedItem.pokes ?? []);
  const sortedComments = [...comments].sort((a, b) => a.createdAt - b.createdAt);

  const handleHeaderBack = () => {
    router.replace({
      pathname: '/(feed)/home',
      params: {
        ...(groupChallengeId ? { groupChallengeId } : {}),
        ...(feedItem.challengeRecordId
          ? { scrollChallengeRecordId: String(feedItem.challengeRecordId) }
          : {}),
      },
    });
  };

  const navigateToProfile = (userId: string) => {
    if (userId === 'me') return;
    const info = memberStore.get(Number(userId));
    if (!info) return;
    router.push({
      pathname: '/(group)/mypage',
      params: {
        memberId: String(info.groupMemberId),
        friendName: info.displayName,
        friendUserId: userId,
        friendGroupId: String(info.groupId),
        challengeRecordId: String(info.challengeRecordId),
      },
    });
  };

  const handleReact = async (reaction: string) => {
    const reactionCode = normalizeReactionCode(reaction);
    if (!reactionCode) return;

    const hasThis = myReactionEmojis.some((current) => isSameReaction(current, reactionCode));
    if (hasThis) {
      setReactions((prev) =>
        prev.filter((r) => !(r.userId === 'me' && isSameReaction(r.emoji, reactionCode)))
      );
      setMyReactionEmojis((prev) => prev.filter((e) => !isSameReaction(e, reactionCode)));
      setReactionCount((prev) => Math.max(0, prev - 1));
      if (!feedItem.challengeRecordId) return;
      const reactionId = myReactionIds[reactionCode];
      if (!reactionId) return;
      try {
        await apiClient.delete(
          `/challenge-records/${feedItem.challengeRecordId}/reactions/${reactionId}`
        );
        setMyReactionIds((prev) => {
          const copy = { ...prev };
          delete copy[reactionCode];
          return copy;
        });
      } catch {}
    } else {
      const entry: ReactionEntry = {
        userId: 'me',
        name: '나',
        avatarSource: AVATAR_SOURCE as number,
        emoji: reactionCode,
      };
      setReactions((prev) => [entry, ...prev]);
      setMyReactionEmojis((prev) => [...prev, reactionCode]);
      setReactionCount((prev) => prev + 1);
      if (!feedItem.challengeRecordId) return;
      try {
        const res = await apiClient.post<{ reactionId: number }>(
          `/challenge-records/${feedItem.challengeRecordId}/reactions`,
          { reactionCode }
        );
        setMyReactionIds((prev) => ({ ...prev, [reactionCode]: res.data.reactionId }));
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
      await apiClient.post(`/challenge-records/${feedItem.challengeRecordId}/comments`, {
        commentBody: text,
      });
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing[14] }]}>
        <Pressable onPress={handleHeaderBack} style={styles.headerBackButton}>
          <Icon name="caretLeft" size={20} color={gray[900]} />
          <Text style={styles.headerTitle}>게시물</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.postArea}>
          <View style={styles.card}>
            {feedItem.isVerified ? (
              <>
                <View style={styles.verifiedHeader}>
                  <View style={styles.avatarWithLabel}>
                    <Image
                      source={feedItem.avatarSource}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                    <View style={styles.statusLabelAnchor}>
                      <View style={[styles.statusLabel, { backgroundColor: statusLabelColor }]}>
                        <Text style={styles.statusLabelText}>
                          {feedItem.isGoalAchieved ? '목표 성공' : '목표 실패'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.memberName, { flexShrink: 0 }]}>{feedItem.name}</Text>
                  {feedItem.verifiedTimeAgo != null && (
                    <Text style={styles.timeAgo}>{feedItem.verifiedTimeAgo}</Text>
                  )}
                </View>

                {usesPostLayout ? (
                  <>
                    {feedItem.photoSource != null && (
                      <Image
                        source={feedItem.photoSource}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    )}
                    {postText != null && <Text style={styles.postText}>{postText}</Text>}
                  </>
                ) : (
                  <View style={styles.retroCard}>
                    <Text style={styles.retroLabel}>한 줄 회고</Text>
                    <Text style={styles.retroText}>{feedItem.retroText}</Text>
                  </View>
                )}

                {feedItem.screenTime != null && (
                  <View
                    style={[styles.screentimeRow, { backgroundColor: screentimeBackgroundColor }]}
                  >
                    <Text style={[styles.screentimeLabel, { color: screentimeAccentColor }]}>
                      내 스크린타임
                    </Text>
                    <Text style={[styles.screentimeValue, { color: screentimeAccentColor }]}>
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
                    onPress={async () => {
                      Alert.alert(`${feedItem.name}님을 콕 찔렀어요!`);
                      pokeStore.add(feedItem.id);
                      setIsPoked(true);
                      setFetchedPokes((prev) => {
                        if (prev.some((p) => p.userId === 'me')) return prev;
                        const myEntry: PokeEntry = {
                          userId: 'me',
                          name: '나',
                          avatarSource: AVATAR_SOURCE as number,
                        };
                        return [myEntry, ...prev];
                      });
                      setPokeCount((prev) => prev + 1);
                      if (feedItem.challengeRecordId) {
                        try {
                          await apiClient.post(
                            `/challenge-records/${feedItem.challengeRecordId}/pokes/${feedItem.id}`
                          );
                        } catch {
                          // 에러 무시
                        }
                      }
                    }}
                  >
                    <Image source={POCK_ICON} style={styles.pockIcon} resizeMode="contain" />
                    <Text style={[styles.pokeButtonText, isPoked && styles.pokeButtonTextDisabled]}>
                      콕 찌르기
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.engagementPanel}>
          {feedItem.isVerified ? (
            <View style={styles.section}>
              <SectionHeading label="리액션" count={reactionCount} />
              {reactions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pokeRow}
                >
                  {reactions.map((r) => {
                    const reactionSource = getReactionSource(r.emoji);
                    return (
                      <Pressable
                        key={`${r.userId}-${r.emoji}`}
                        style={styles.pokeAvatarItem}
                        onPress={() => navigateToProfile(r.userId)}
                      >
                        <View style={styles.pokeAvatarWrapper}>
                          <Image
                            source={r.avatarSource}
                            style={styles.pokeAvatar}
                            resizeMode="cover"
                          />
                          <View style={styles.pokeEmoji}>
                            {reactionSource ? (
                              <Image
                                source={reactionSource}
                                style={styles.reactionEmojiImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Text style={styles.pokeEmojiText}>{r.emoji}</Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.pokeAvatarName}>{r.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <SectionHeading label="콕 찌름" count={pokeCount} />
              {displayPokes.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pokeRow}
                >
                  {displayPokes.map((p) => (
                    <Pressable
                      key={p.userId}
                      style={styles.pokeAvatarItem}
                      onPress={() => navigateToProfile(p.userId)}
                    >
                      <View style={styles.pokeAvatarWrapper}>
                        <Image
                          source={p.avatarSource}
                          style={styles.pokeAvatar}
                          resizeMode="cover"
                        />
                        <View style={styles.pokeEmoji}>
                          <Image
                            source={POCK_ICON}
                            style={styles.pokeEmojiImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                      <Text style={styles.pokeAvatarName}>{p.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.section}>
            <SectionHeading label="댓글" count={commentCount} />
            <View style={styles.commentList}>
              {sortedComments.map((comment, index) => (
                <View
                  key={comment.id}
                  style={[
                    styles.commentItem,
                    index < sortedComments.length - 1 && styles.commentDivider,
                  ]}
                >
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
          </View>
        </View>
      </ScrollView>

      {state === 'authReady' &&
        (showReactionPicker ? (
          <>
            <Pressable style={styles.pickerOverlay} onPress={() => setShowReactionPicker(false)} />
            <View
              style={[styles.pickerBar, { paddingBottom: Math.max(insets.bottom, spacing[12]) }]}
            >
              <ReactionPicker
                selectedReactions={myReactionEmojis}
                style={styles.bottomReactionPicker}
                onSelect={(reactionCode) => {
                  handleReact(reactionCode);
                  setShowReactionPicker(false);
                }}
              />
            </View>
          </>
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
                <Icon name="paperPlaneRight" size={20} color={WHITE} />
              </Pressable>
            ) : (
              <Pressable style={styles.impressionBtn} onPress={() => setShowReactionPicker(true)}>
                <Image
                  source={IMPRESSION_ICON}
                  style={styles.impressionIcon}
                  resizeMode="contain"
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
    paddingBottom: spacing[14],
    gap: spacing[8],
    backgroundColor: brown[50],
  },
  headerBackButton: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  content: {
    paddingBottom: 0,
  },
  postArea: {
    backgroundColor: WHITE,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
    paddingBottom: spacing[56],
  },
  card: {
    gap: spacing[12],
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    marginBottom: spacing[8],
  },
  avatarWithLabel: {
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
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
    ...typography.accent.body1,
    color: gray[900],
  },
  timeAgo: {
    ...typography.accent.body3,
    color: gray[300],
  },
  photo: {
    width: '100%',
    aspectRatio: 343 / 268,
    borderRadius: radius[16],
    marginTop: spacing[8],
  },
  postText: {
    ...typography.primary.body1R,
    color: gray[900],
  },
  retroCard: {
    backgroundColor: system.red.opacity10,
    borderRadius: radius[16],
    padding: spacing[16],
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
    borderRadius: radius[16],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  screentimeLabel: {
    ...typography.primary.body3B,
    color: system.green.opacity100,
  },
  screentimeValue: {
    ...typography.primary.body1B,
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
  pockIcon: {
    width: 22,
    height: 17,
  },
  engagementPanel: {
    backgroundColor: brown[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -spacing[24],
    paddingHorizontal: spacing[16],
    paddingTop: spacing[28],
    paddingBottom: 112,
    gap: spacing[28],
  },
  section: {
    gap: spacing[12],
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  sectionTitle: {
    ...typography.primary.body2B,
    color: gray[900],
  },
  sectionCount: {
    ...typography.primary.body2B,
    color: gray[500],
  },
  pokeRow: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  pokeAvatarItem: {
    alignItems: 'center',
    gap: spacing[4],
    width: 48,
  },
  pokeAvatarWrapper: {
    width: 48,
    height: 48,
  },
  pokeAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
  },
  pokeEmoji: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeEmojiImage: {
    width: 13,
    height: 10,
  },
  reactionEmojiImage: {
    width: 14,
    height: 14,
  },
  pokeEmojiText: {
    fontSize: 10,
  },
  pokeAvatarName: {
    ...typography.accent.body3,
    color: gray[900],
  },
  commentList: {
    marginTop: -spacing[4],
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
    paddingVertical: spacing[16],
  },
  commentDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: gray[50],
  },
  commentAvatar: {
    width: 32,
    height: 32,
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
    ...typography.accent.body2,
    color: gray[900],
  },
  commentTime: {
    ...typography.accent.caption,
    color: gray[300],
  },
  commentText: {
    ...typography.primary.body2R,
    color: gray[900],
  },
  // Bottom input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    gap: spacing[8],
    backgroundColor: brown[50],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: gray[50],
  },
  impressionBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  impressionIcon: {
    width: 26,
    height: 26,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: WHITE,
    borderRadius: radius.full,
    paddingHorizontal: spacing[16],
    ...typography.primary.body1R,
    color: gray[900],
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Reaction picker bar
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    backgroundColor: brown[50],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: gray[50],
  },
  bottomReactionPicker: {
    flex: 1,
  },
});
