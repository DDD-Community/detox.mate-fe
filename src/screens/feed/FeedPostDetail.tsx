import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';
import type { FeedItem } from './FeedCard';

const { gray, green, brown, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SOURCE = require('../../../assets/basic-profile-turtle-hi.png');

type PokeItem = {
  id: string;
  name: string;
  avatarSource: number;
  pokedAt: number;
};

type CommentItem = {
  id: string;
  authorName: string;
  avatarSource: number;
  text: string;
  createdAt: number;
  timeAgoLabel: string;
};

const NOW = Date.now();

const MOCK_POKES: PokeItem[] = [
  { id: '1', name: '지수', avatarSource: AVATAR_SOURCE, pokedAt: NOW - 30 * 60 * 1000 },
  { id: '2', name: '승호', avatarSource: AVATAR_SOURCE, pokedAt: NOW - 60 * 60 * 1000 },
];

export const MOCK_COMMENTS: CommentItem[] = [
  {
    id: '1',
    authorName: '민준',
    avatarSource: AVATAR_SOURCE,
    text: '야 너 인증 언제할거야',
    createdAt: NOW - 60 * 60 * 1000,
    timeAgoLabel: '1시간 전',
  },
  {
    id: '2',
    authorName: '서연',
    avatarSource: AVATAR_SOURCE,
    text: '스겜하겠음 ㅈㅅㅈㅅ',
    createdAt: NOW - 30 * 60 * 1000,
    timeAgoLabel: '30분 전',
  },
];

const BODY_TEXT: Record<GoalState, string> = {
  notSet: '개인 목표를 설정해야 해요',
  setWaiting: '내일부터 인증 가능해요',
  authReady: '아직 인증하지 않았어요',
};

export default function FeedPostDetail() {
  const {
    item: itemJson,
    goalState,
    isPoked: isPokedParam,
  } = useLocalSearchParams<{
    item: string;
    goalState: GoalState;
    isPoked: string;
  }>();

  const feedItem = JSON.parse(itemJson as string) as FeedItem;
  const state: GoalState = goalState ?? 'authReady';
  const [isPoked, setIsPoked] = useState(isPokedParam === '1');

  const sortedPokes = [...MOCK_POKES].sort((a, b) => b.pokedAt - a.pokedAt);
  const sortedComments = [...MOCK_COMMENTS].sort((a, b) => a.createdAt - b.createdAt);

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
                  onPress={() => setIsPoked(true)}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>콕 찌름 {sortedPokes.length}</Text>
          <View style={styles.pokeRow}>
            {sortedPokes.map((poke) => (
              <View key={poke.id} style={styles.pokeAvatarItem}>
                <View style={styles.pokeAvatarWrapper}>
                  <Image source={poke.avatarSource} style={styles.pokeAvatar} resizeMode="cover" />
                  <View style={styles.pokeEmoji}>
                    <Text style={styles.pokeEmojiText}>👉</Text>
                  </View>
                </View>
                <Text style={styles.pokeAvatarName}>{poke.name}</Text>
              </View>
            ))}
          </View>
        </View>

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
