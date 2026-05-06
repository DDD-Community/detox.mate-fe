import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';

const { gray, green } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SIZE = 36;

export type FeedItem = {
  id: string;
  name: string;
  isMe: boolean;
  avatarSource: number;
  commentCount: number;
};

const BODY_TEXT: Record<GoalState, string> = {
  notSet: '개인 목표를 설정해야 해요',
  setWaiting: '내일부터 인증 가능해요',
  authReady: '아직 인증하지 않았어요',
};

export default function FeedCard({
  item,
  goalState,
  onPoke,
  onBodyPress,
}: {
  item: FeedItem;
  goalState: GoalState;
  onPoke?: (memberId: string) => void;
  onBodyPress?: () => void;
}) {
  const { name, isMe, avatarSource, commentCount } = item;

  const showSubtitle = goalState === 'notSet' && isMe;
  const showPokeButton = !isMe && goalState !== 'setWaiting';
  const showCommentCount = goalState === 'authReady';
  const hasFooter = showPokeButton || showCommentCount;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
        <Text style={styles.memberName}>{name}</Text>
      </View>

      <Pressable style={styles.body} onPress={onBodyPress} disabled={!onBodyPress}>
        <Text style={styles.bodyText}>{BODY_TEXT[goalState]}</Text>
        {showSubtitle && (
          <Text style={styles.subtitleText}>미 설정 시 그룹 스트릭에서 제외돼요</Text>
        )}
      </Pressable>

      {hasFooter && (
        <View style={styles.footer}>
          {showPokeButton && (
            <PokeButton
              onPress={() => {
                Alert.alert(`${name}님을 콕 찔렀어요!`);
                onPoke?.(item.id);
              }}
            />
          )}
          {showCommentCount && <CommentCount count={commentCount} />}
        </View>
      )}
    </View>
  );
}

function PokeButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.pokeButton} onPress={onPress}>
      <Text>👉</Text>
      <Text style={styles.pokeButtonText}>콕 찌르기</Text>
    </Pressable>
  );
}

function CommentCount({ count }: { count: number }) {
  return (
    <View style={styles.commentRow}>
      <Image
        source={require('../../../assets/icons/regular/icon_rg_Chat.png')}
        style={styles.commentIcon}
        resizeMode="contain"
      />
      <Text style={styles.commentCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: radius[16],
    padding: spacing[16],
    gap: spacing[12],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
  },
  memberName: {
    ...typography.primary.body2B,
    color: gray[900],
  },
  body: {
    gap: spacing[4],
    alignItems: 'center',
  },
  bodyText: {
    ...typography.primary.body2R,
    color: gray[500],
    textAlign: 'center',
  },
  subtitleText: {
    ...typography.primary.body3R,
    color: gray[400],
    textAlign: 'center',
  },
  footer: {
    gap: spacing[8],
    alignItems: 'flex-start',
  },
  pokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: green[300],
    borderRadius: radius.full,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[12],
    gap: spacing[4],
  },
  pokeButtonText: {
    ...typography.primary.body3B,
    color: WHITE,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  commentIcon: {
    width: 16,
    height: 16,
  },
  commentCount: {
    ...typography.primary.body3R,
    color: gray[400],
  },
});
