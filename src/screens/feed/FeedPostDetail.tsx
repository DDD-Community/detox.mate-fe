import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import apiClient from '../../api/client';
import { pokeStore } from '../../lib/pokeStore';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';
import type { FeedItem, PokeEntry, ReactionEntry } from './FeedCard';

const { gray, green, brown, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SOURCE = require('../../../assets/basic-profile-turtle-hi.png');

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
  author: { userId: number; displayName: string; profileImageUrl: string };
  body: string;
  createdAt: string;
  replyCount: number;
};

type CommentsResponse = {
  totalCount: number;
  items: CommentAPIItem[];
  nextCursor: string | null;
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

  const feedItem = JSON.parse(itemJson as string) as FeedItem;
  const state: GoalState = goalState ?? 'authReady';
  const [isPoked, setIsPoked] = useState(isPokedParam === '1');
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    if (!groupChallengeId || !feedItem.stampId) return;
    const fetchComments = async () => {
      try {
        const res = await apiClient.get<CommentsResponse>(
          `/group-challenges/${groupChallengeId}/stamps/${feedItem.stampId}/comments`
        );
        setComments(
          res.data.items.map((c) => ({
            id: String(c.commentId),
            authorName: c.author.displayName,
            avatarSource: c.author.profileImageUrl
              ? { uri: c.author.profileImageUrl }
              : AVATAR_SOURCE,
            text: c.body,
            createdAt: new Date(c.createdAt).getTime(),
            timeAgoLabel: formatTimeAgo(new Date(c.createdAt).getTime()),
          }))
        );
      } catch {
        // keep mock data on error
      }
    };
    fetchComments();
  }, [groupChallengeId, feedItem.stampId]);

  // merge user's own reaction in (from route param) in case feedItem.reactions doesn't have it yet
  const ownInList = (feedItem.reactions ?? []).some((r) => r.userId === 'me');
  const ownEntry: ReactionEntry[] =
    myReaction && !ownInList
      ? [{ userId: 'me', name: '나', avatarSource: AVATAR_SOURCE as number, emoji: myReaction }]
      : [];
  const displayReactions: ReactionEntry[] = [...ownEntry, ...(feedItem.reactions ?? [])];
  const displayPokes: PokeEntry[] = feedItem.pokes ?? [];

  const sortedComments = [...comments].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <View style={styles.root}>
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
              {/* Verified header: avatar+label / name / timeAgo */}
              <View style={styles.verifiedHeader}>
                <View style={styles.avatarWithLabel}>
                  <Image source={feedItem.avatarSource} style={styles.avatar} resizeMode="cover" />
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
                <Text style={[styles.memberName, { flex: 1 }]}>{feedItem.name}</Text>
                {feedItem.verifiedTimeAgo != null && (
                  <Text style={styles.timeAgo}>{feedItem.verifiedTimeAgo}</Text>
                )}
              </View>

              {/* Post content */}
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
                  <Text style={styles.screentimeLabel}>스크린타임</Text>
                  <Text style={styles.screentimeValue}>{feedItem.screenTime}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Unverified header */}
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
            <Text style={styles.sectionTitle}>감정 표현 {feedItem.reactionCount}</Text>
            {displayReactions.length > 0 && (
              <View style={styles.pokeRow}>
                {displayReactions.map((r) => (
                  <View key={r.userId} style={styles.pokeAvatarItem}>
                    <View style={styles.pokeAvatarWrapper}>
                      <Image source={r.avatarSource} style={styles.pokeAvatar} resizeMode="cover" />
                      <View style={styles.pokeEmoji}>
                        <Text style={styles.pokeEmojiText}>{r.emoji}</Text>
                      </View>
                    </View>
                    <Text style={styles.pokeAvatarName}>{r.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>콕 찌름 {feedItem.pokeCount}</Text>
            {displayPokes.length > 0 && (
              <View style={styles.pokeRow}>
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
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>댓글 {sortedComments.length}</Text>
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
              <Pressable style={styles.moreButton}>
                <Image
                  source={require('../../../assets/icons/regular/icon_rg_DotsThree.png')}
                  style={styles.moreIcon}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: spacing[40],
    gap: spacing[12],
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: radius[16],
    padding: spacing[16],
    gap: spacing[12],
  },
  // Verified header
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  avatarWithLabel: {
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
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
  // Post content
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radius[8],
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
    color: gray[500],
  },
  screentimeValue: {
    ...typography.primary.body3B,
    color: gray[900],
  },
  // Unverified card
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
    paddingHorizontal: spacing[20],
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
  // Poke + comment sections
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
  moreButton: {
    padding: spacing[4],
    flexShrink: 0,
  },
  moreIcon: {
    width: 16,
    height: 16,
  },
});
