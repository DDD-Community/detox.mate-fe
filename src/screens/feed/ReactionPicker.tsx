import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { primitiveColors, radius, spacing } from '../../lib/token';

const { gray } = primitiveColors;

export type ReactionCode = 'HEART' | 'CLAP' | 'FIRE' | 'MUSCLE' | 'HAMMER' | 'SURPRISED';

export type ReactionOption = {
  code: ReactionCode;
  source: ImageSourcePropType;
};

export const REACTION_OPTIONS: ReactionOption[] = [
  { code: 'HEART', source: require('../../../assets/reaction-heart.png') },
  { code: 'CLAP', source: require('../../../assets/reaction-clap.png') },
  { code: 'FIRE', source: require('../../../assets/reaction-fire.png') },
  { code: 'MUSCLE', source: require('../../../assets/reaction-strength.png') },
  { code: 'HAMMER', source: require('../../../assets/reaction-hammer.png') },
  { code: 'SURPRISED', source: require('../../../assets/reaction-surprised.png') },
];

const REACTION_SOURCE_BY_CODE = REACTION_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.code]: option.source }),
  {} as Record<ReactionCode, ImageSourcePropType>
);

const LEGACY_REACTION_MAP: Record<string, ReactionCode> = {
  HEART: 'HEART',
  CLAP: 'CLAP',
  FIRE: 'FIRE',
  FIGHTING: 'FIRE',
  MUSCLE: 'MUSCLE',
  HAMMER: 'HAMMER',
  SURPRISED: 'SURPRISED',
  THUMBSUP: 'CLAP',
  TURTLE: 'HEART',
  GLOOMY: 'SURPRISED',
  '👍': 'CLAP',
  '👏': 'CLAP',
  '🔥': 'FIRE',
  '💪': 'MUSCLE',
  '🐢': 'HEART',
  '🥹': 'SURPRISED',
};

export function normalizeReactionCode(
  reaction: string | undefined | null
): ReactionCode | undefined {
  if (!reaction) return undefined;
  return LEGACY_REACTION_MAP[reaction] ?? undefined;
}

export function getReactionSource(
  reaction: string | undefined | null
): ImageSourcePropType | undefined {
  const code = normalizeReactionCode(reaction);
  return code ? REACTION_SOURCE_BY_CODE[code] : undefined;
}

export function isSameReaction(a: string, b: string): boolean {
  return normalizeReactionCode(a) === normalizeReactionCode(b);
}

export default function ReactionPicker({
  selectedReactions = [],
  onSelect,
  style,
}: {
  selectedReactions?: string[];
  onSelect: (reactionCode: ReactionCode) => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.container, style]}>
      {REACTION_OPTIONS.map((option) => {
        const selected = selectedReactions.some((reaction) =>
          isSameReaction(reaction, option.code)
        );
        return (
          <Pressable
            key={option.code}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onSelect(option.code)}
          >
            <Image source={option.source} style={styles.icon} resizeMode="contain" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: radius.full,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    shadowColor: gray[900],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  option: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  icon: {
    width: 26,
    height: 26,
  },
});
