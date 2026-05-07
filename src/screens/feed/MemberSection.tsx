import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { gray, green, system } = primitiveColors;
const WHITE = '#FFFFFF';
const AVATAR_SIZE = 52;

export type MemberItem = {
  id: string;
  name: string;
  avatarSource: number;
  badgeCount?: number;
  isGoalAchieved?: boolean;
};

interface Props {
  members: MemberItem[];
  onInvite: () => void;
}

export default function MemberSection({ members, onInvite }: Props) {
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
          <MemberAvatar key={member.id} member={member} />
        ))}
        <InviteButton onPress={onInvite} />
      </ScrollView>
    </View>
  );
}

function MemberAvatar({ member }: { member: MemberItem }) {
  return (
    <View style={styles.avatarItem}>
      <View style={styles.avatarWrapper}>
        <Image source={member.avatarSource} style={styles.avatar} resizeMode="cover" />
        {member.isGoalAchieved && <View style={styles.avatarRing} />}
        {member.isGoalAchieved && (
          <View style={styles.checkBadge}>
            <Image
              source={require('../../../assets/icons/regular/icon_rg_Check.png')}
              style={styles.checkIcon}
              resizeMode="contain"
            />
          </View>
        )}
        {!member.isGoalAchieved && member.badgeCount !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{member.badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.avatarName}>{member.name}</Text>
    </View>
  );
}

function InviteButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.avatarItem} onPress={onPress}>
      <View style={styles.inviteCircle}>
        <Image
          source={require('../../../assets/icons/regular/icon_rg_Plus.png')}
          style={styles.plusIcon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.avatarName}>초대하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  legendText: {
    ...typography.primary.body3R,
    color: gray[500],
  },
  avatarRow: {
    gap: spacing[16],
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
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: green[300],
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: green[300],
    borderWidth: 1.5,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 10,
    height: 10,
    tintColor: WHITE,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: system.orange.opacity100,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.primary.caption2,
    color: WHITE,
  },
  avatarName: {
    ...typography.primary.body3R,
    color: gray[700],
  },
  inviteCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    width: 20,
    height: 20,
  },
});
