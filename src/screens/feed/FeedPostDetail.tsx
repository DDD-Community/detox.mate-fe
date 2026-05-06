import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';

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

// sorted newest-first already; sortedPokes below re-sorts defensively
const MOCK_POKES: PokeItem[] = [
  { id: '1', name: '지수', avatarSource: AVATAR_SOURCE, pokedAt: NOW - 30 * 60 * 1000 },
  { id: '2', name: '승호', avatarSource: AVATAR_SOURCE, pokedAt: NOW - 60 * 60 * 1000 },
];

// sorted oldest-first already; sortedComments below re-sorts defensively
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

const MEMBER_NAMES: Record<string, string> = {
  '1': '나',
  '2': '서연',
};

const BODY_TEXT: Record<GoalState, string> = {
  notSet: '개인 목표를 설정해야 해요',
  setWaiting: '내일부터 인증 가능해요',
  authReady: '아직 인증하지 않았어요',
};

export default function FeedPostDetail() {
  const { memberId, goalState } = useLocalSearchParams<{
    memberId: string;
    goalState: GoalState;
  }>();

  const memberName = MEMBER_NAMES[memberId] ?? '멤버';
  const state: GoalState = goalState ?? 'authReady';

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
          <View style={styles.memberRow}>
            <Image source={AVATAR_SOURCE} style={styles.avatar} resizeMode="cover" />
            <Text style={styles.memberName}>{memberName}</Text>
          </View>

          <Text style={styles.statusText}>{BODY_TEXT[state]}</Text>

          <Pressable style={styles.pokeButton}>
            <Text>👉</Text>
            <Text style={styles.pokeButtonText}>콕 찌르기</Text>
          </Pressable>
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
    // paddingHorizontal: spacing[24],
    paddingBottom: spacing[40],
    gap: spacing[12],
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: radius[16],
    padding: spacing[20],
    alignItems: 'center',
    gap: spacing[12],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[8],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  memberName: {
    ...typography.primary.body2B,
    color: gray[900],
  },
  statusText: {
    ...typography.primary.body2R,
    color: gray[500],
    textAlign: 'center',
  },
  pokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
