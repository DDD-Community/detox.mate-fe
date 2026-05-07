import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { GoalState } from './ActionGuideBanner';

const { gray, green, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SIZE = 36;
const REACTION_EMOJIS = ['👍', '🔥', '💪', '🐢', '🥹'] as const;

export type FeedItem = {
  id: string;
  name: string;
  isMe: boolean;
  avatarSource: number;
  commentCount: number;
  reactionCount: number;
  isVerified?: boolean;
  verifiedTimeAgo?: string;
  isGoalAchieved?: boolean;
  photoSource?: number;
  postText?: string;
  retroText?: string;
  screenTime?: string;
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
  isPoked = false,
  myReaction,
  onReact,
}: {
  item: FeedItem;
  goalState: GoalState;
  onPoke?: (memberId: string) => void;
  onBodyPress?: () => void;
  isPoked?: boolean;
  myReaction?: string;
  onReact?: (itemId: string, emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  if (item.isVerified) {
    const labelBg = item.isGoalAchieved ? green[300] : gray[400];
    const labelText = item.isGoalAchieved ? '목표 성공' : '목표 실패';

    return (
      <Pressable style={[styles.card, showPicker && styles.cardFront]} onPress={onBodyPress}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWithLabel}>
            <Image source={item.avatarSource} style={styles.avatar} resizeMode="cover" />
            <View style={[styles.statusLabel, { backgroundColor: labelBg }]}>
              <Text style={styles.statusLabelText}>{labelText}</Text>
            </View>
          </View>
          <Text style={[styles.memberName, { flex: 1 }]}>{item.name}</Text>
          <Text style={styles.timeAgo}>{item.verifiedTimeAgo}</Text>
        </View>

        {/* Content */}
        {item.isGoalAchieved ? (
          <>
            {item.photoSource != null && (
              <Image source={item.photoSource} style={styles.photo} resizeMode="cover" />
            )}
            {item.postText != null && <Text style={styles.postText}>{item.postText}</Text>}
          </>
        ) : (
          <View style={styles.retroCard}>
            <Text style={styles.retroLabel}>한 줄 회고</Text>
            <Text style={styles.retroText}>{item.retroText}</Text>
          </View>
        )}

        {/* Screentime */}
        {item.screenTime != null && (
          <View
            style={[
              styles.screentimeRow,
              { backgroundColor: item.isGoalAchieved ? system.green.opacity10 : gray[50] },
            ]}
          >
            <Text style={styles.screentimeLabel}>스크린타임</Text>
            <Text style={styles.screentimeValue}>{item.screenTime}</Text>
          </View>
        )}

        {/* Footer + reaction picker (absolute, below footer) */}
        <View style={styles.footerWrapper}>
          <View style={styles.footer}>
            <Pressable style={styles.footerButton} onPress={() => setShowPicker((v) => !v)}>
              <Image
                source={require('../../../assets/impressions.png')}
                style={styles.impressionIcon}
                resizeMode="contain"
              />
              <Text style={styles.footerCount}>{item.reactionCount}</Text>
            </Pressable>
            <Pressable style={styles.footerButton} onPress={onBodyPress}>
              <Image
                source={require('../../../assets/icons/regular/icon_rg_Chat.png')}
                style={styles.footerIcon}
                resizeMode="contain"
              />
              <Text style={styles.footerCount}>{item.commentCount}</Text>
            </Pressable>
          </View>
          {showPicker && (
            <View style={styles.reactionPicker}>
              {REACTION_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={styles.reactionOption}
                  onPress={() => {
                    onReact?.(item.id, emoji);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.reactionOptionText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // ── Unverified card ──
  const showPokeButton = !item.isMe && goalState !== 'setWaiting';

  return (
    <View style={[styles.card, showPicker && styles.cardFront]}>
      <View style={styles.header}>
        <Image source={item.avatarSource} style={styles.avatar} resizeMode="cover" />
        <Text style={styles.memberName}>{item.name}</Text>
      </View>

      <Pressable style={styles.body} onPress={onBodyPress} disabled={!onBodyPress}>
        <Text style={styles.bodyText}>{BODY_TEXT[goalState]}</Text>
      </Pressable>

      {showPokeButton && (
        <Pressable
          style={[styles.pokeButton, isPoked && styles.pokeButtonDisabled]}
          disabled={isPoked}
          onPress={() => {
            Alert.alert(`${item.name}님을 콕 찔렀어요!`);
            onPoke?.(item.id);
          }}
        >
          <Text>👉</Text>
          <Text style={[styles.pokeButtonText, isPoked && styles.pokeButtonTextDisabled]}>
            콕 찌르기
          </Text>
        </Pressable>
      )}

      <View style={styles.footerWrapper}>
        <View style={styles.footer}>
          <Pressable style={styles.footerButton} onPress={() => setShowPicker((v) => !v)}>
            <Image
              source={require('../../../assets/impressions.png')}
              style={styles.impressionIcon}
              resizeMode="contain"
            />
            <Text style={styles.footerCount}>{item.reactionCount}</Text>
          </Pressable>
          <Pressable style={styles.footerButton} onPress={onBodyPress}>
            <Image
              source={require('../../../assets/icons/regular/icon_rg_Chat.png')}
              style={styles.footerIcon}
              resizeMode="contain"
            />
            <Text style={styles.footerCount}>{item.commentCount}</Text>
          </Pressable>
        </View>
        {showPicker && (
          <View style={styles.reactionPicker}>
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.reactionOption}
                onPress={() => {
                  onReact?.(item.id, emoji);
                  setShowPicker(false);
                }}
              >
                <Text style={styles.reactionOptionText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: radius[16],
    padding: spacing[16],
    gap: spacing[12],
    overflow: 'visible',
  },
  cardFront: {
    zIndex: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  avatarWithLabel: {
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
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
  photo: {
    width: '100%',
    height: 180,
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
  footerWrapper: {
    position: 'relative',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  reactionPicker: {
    position: 'absolute',
    top: 32,
    left: 0,
    zIndex: 100,
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: radius.full,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    gap: spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  reactionOption: {},
  reactionOptionText: {
    fontSize: 22,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  impressionIcon: {
    width: 18,
    height: 18,
  },
  footerIcon: {
    width: 16,
    height: 16,
  },
  footerCount: {
    ...typography.primary.body3R,
    color: gray[500],
  },
  // Unverified-only styles
  body: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  bodyText: {
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
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[12],
    gap: spacing[4],
  },
  pokeButtonDisabled: {
    backgroundColor: gray[200],
  },
  pokeButtonText: {
    ...typography.primary.body3B,
    color: WHITE,
  },
  pokeButtonTextDisabled: {
    color: gray[400],
  },
});
