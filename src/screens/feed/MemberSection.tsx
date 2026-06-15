import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { LoggingButton } from '../../components';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { gray, green, level, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SIZE = 48;
const AVATAR_RING_WIDTH = 2;
const VERIFIED_CHECK_BADGE_SIZE = 12;
const VERIFIED_CHECK_ICON_SIZE = 8;
const VERIFIED_CHECK_BADGE_COLOR = '#439646';

export type MemberItem = {
  id: string;
  name: string;
  isMe: boolean;
  avatarSource: number | { uri: string };
  badgeCount?: number;
  isVerified?: boolean;
  isGoalAchieved?: boolean;
};

interface Props {
  members: MemberItem[];
  onInvite: () => void;
  onMemberPress?: (memberId: string) => void;
}

export default function MemberSection({ members, onInvite, onMemberPress }: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const containerWidth = useRef(0);
  const contentWidth = useRef(0);

  const updateScroll = () => {
    setScrollEnabled(contentWidth.current > containerWidth.current);
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width - spacing[16] * 2;
        updateScroll();
      }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>멤버</Text>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: green[300] }]} />
          <Text style={styles.legendText}>인증</Text>
          <View style={[styles.dot, { backgroundColor: system.red.opacity100 }]} />
          <Text style={styles.legendText}>콕 찌름</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarRow}
        onContentSizeChange={(w) => {
          contentWidth.current = w;
          updateScroll();
        }}
      >
        {members.map((member) => (
          <LoggingButton
            key={member.id}
            eventName="Feed Home Member Avatar Press Clicked"
            properties={{ pageName: 'FeedHome', buttonName: '멤버 아바타' }}
          >
            <MemberAvatar member={member} onPress={() => onMemberPress?.(member.id)} />
          </LoggingButton>
        ))}
        <InviteButton onPress={onInvite} />
      </ScrollView>
    </View>
  );
}

function MemberAvatar({ member, onPress }: { member: MemberItem; onPress?: () => void }) {
  const isVerified = member.isVerified ?? member.isGoalAchieved;

  return (
    <Pressable
      style={styles.avatarItem}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${member.isMe ? '나' : member.name} 피드로 이동`}
    >
      <View style={styles.avatarWrapper}>
        <Image source={member.avatarSource} style={styles.avatar} resizeMode="cover" />
        {isVerified ? <VerifiedAvatarRing /> : <View style={styles.avatarBorder} />}
        {isVerified && (
          <View style={styles.checkBadge}>
            <VerifiedCheckIcon />
          </View>
        )}
        {!isVerified && member.badgeCount !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{member.badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.avatarName}>
        {(() => {
          const label = member.isMe ? '나' : member.name;
          return label.length >= 5 ? `${label.slice(0, 4)}...` : label;
        })()}
      </Text>
    </Pressable>
  );
}

function VerifiedAvatarRing() {
  const center = AVATAR_SIZE / 2;
  const ringRadius = center - AVATAR_RING_WIDTH / 2;

  return (
    <Svg
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      viewBox={`0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}`}
      style={styles.avatarRing}
    >
      <Defs>
        <LinearGradient
          id="verifiedAvatarGradient"
          x1="0"
          y1="0"
          x2={AVATAR_SIZE}
          y2={AVATAR_SIZE}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={level[100]} />
          <Stop offset="0.52" stopColor={level[300]} />
          <Stop offset="1" stopColor={level[500]} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke="url(#verifiedAvatarGradient)"
        strokeWidth={AVATAR_RING_WIDTH}
      />
    </Svg>
  );
}

function VerifiedCheckIcon() {
  return (
    <Svg
      width={VERIFIED_CHECK_ICON_SIZE}
      height={VERIFIED_CHECK_ICON_SIZE}
      viewBox={`0 0 ${VERIFIED_CHECK_ICON_SIZE} ${VERIFIED_CHECK_ICON_SIZE}`}
    >
      <Path
        d="M6.67701 0.927014L2.67701 4.92701C2.6538 4.95026 2.62622 4.9687 2.59587 4.98128C2.56552 4.99386 2.53299 5.00034 2.50014 5.00034C2.46729 5.00034 2.43475 4.99386 2.4044 4.98128C2.37405 4.9687 2.34648 4.95026 2.32326 4.92701L0.573264 3.17701C0.526354 3.1301 0.5 3.06648 0.5 3.00014C0.5 2.9338 0.526354 2.87017 0.573264 2.82326C0.620174 2.77635 0.683798 2.75 0.750139 2.75C0.81648 2.75 0.880104 2.77635 0.927014 2.82326L2.50014 4.3967L6.32326 0.573264C6.37017 0.526354 6.4338 0.5 6.50014 0.5C6.56648 0.5 6.6301 0.526354 6.67701 0.573264C6.72392 0.620174 6.75028 0.683798 6.75028 0.750139C6.75028 0.81648 6.72392 0.880104 6.67701 0.927014Z"
        fill={WHITE}
        stroke={WHITE}
        transform="translate(0.5 1.5)"
      />
    </Svg>
  );
}

function InviteButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.avatarItem} onPress={onPress}>
      <View style={styles.inviteCircle}>
        <Icon name="plus" size={20} color={gray[900]} />
      </View>
      <Text style={styles.avatarName}>초대하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 127,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
    paddingBottom: spacing[28],
    gap: spacing[16],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  title: {
    ...typography.primary.body2B,
    color: gray[900],
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  legendText: {
    ...typography.primary.caption2,
    color: gray[900],
  },
  avatarRow: {
    gap: spacing[12],
  },
  avatarItem: {
    alignItems: 'center',
    gap: spacing[4],
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
  },
  avatarRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: gray[200],
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: VERIFIED_CHECK_BADGE_SIZE,
    height: VERIFIED_CHECK_BADGE_SIZE,
    borderRadius: radius.full,
    backgroundColor: VERIFIED_CHECK_BADGE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: system.red.opacity100,
    borderRadius: radius.full,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.primary.caption2,
    lineHeight: 12,
    color: WHITE,
  },
  avatarName: {
    ...typography.accent.body3,
    color: gray[900],
    textAlign: 'center',
  },
  inviteCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
