import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { WeeklyStatusCard } from './WeeklyStatusCard';

const { gray } = primitiveColors;
const DEFAULT_AVATAR = require('../../../../assets/basic-profile-turtle-hi.png');

export interface JoinedGroupItem {
  id?: number;
  name: string;
  members: { name: string; profileImageUrl?: string | null }[];
}

export interface JoinedGroupBodyProps {
  weekLabel: string;
  diffMinutes: number;
  avgScreenTime: string;
  goalScreenTime: string;
  verifiedDays: number;
  totalVerifyDays: number;
  achievedDays: number;
  achievableDays: number;
  groups: JoinedGroupItem[];
  daysUntilGoalChange: number;
  onGroupPress?: (groupId?: number) => void;
  onGoalChangePress?: () => void;
}

function MemberAvatar({
  name,
  profileImageUrl,
  offset,
}: {
  name: string;
  profileImageUrl?: string | null;
  offset: number;
}) {
  return (
    <View style={[styles.avatar, { left: offset }]}>
      <Image
        source={profileImageUrl ? { uri: profileImageUrl } : DEFAULT_AVATAR}
        style={styles.avatarImage}
        resizeMode="cover"
        accessibilityLabel={name ? `${name} 프로필 이미지` : '기본 프로필 이미지'}
      />
    </View>
  );
}

export function JoinedGroupBody({
  weekLabel,
  diffMinutes,
  avgScreenTime,
  goalScreenTime,
  verifiedDays,
  totalVerifyDays,
  achievedDays,
  achievableDays,
  groups,
  daysUntilGoalChange,
  onGroupPress,
  onGoalChangePress,
}: JoinedGroupBodyProps) {
  return (
    <View style={styles.root}>
      <WeeklyStatusCard
        weekLabel={weekLabel}
        diffMinutes={diffMinutes}
        avgScreenTime={avgScreenTime}
        goalScreenTime={goalScreenTime}
        verifiedDays={verifiedDays}
        totalVerifyDays={totalVerifyDays}
        achievedDays={achievedDays}
        achievableDays={achievableDays}
      />

      {groups.map((group) => (
        <Pressable
          key={group.id ?? group.name}
          onPress={() => onGroupPress?.(group.id)}
          style={styles.groupCard}
        >
          <View style={styles.groupCardLeft}>
            <View style={styles.avatarStack}>
              {group.members.slice(0, 3).map((m, idx) => (
                <MemberAvatar
                  key={`${group.id ?? group.name}-${m.name}-${idx}`}
                  name={m.name}
                  profileImageUrl={m.profileImageUrl}
                  offset={idx * 23}
                />
              ))}
            </View>
            <Text style={styles.groupName} numberOfLines={1}>
              {group.name}
            </Text>
          </View>
          <Icon name="caretRight" size={24} color={gray[900]} />
        </Pressable>
      ))}

      <View>
        <Button
          label="목표 스크린 타임 변경"
          color="assistive"
          disabled={daysUntilGoalChange > 0}
          onPress={onGoalChangePress}
          style={styles.cta}
        />
        {daysUntilGoalChange > 0 ? (
          <View style={styles.changeHintRow}>
            <Icon name="info" size={18} weight="fill" color={gray[500]} />
            <Text style={styles.changeHintText}>{daysUntilGoalChange}일 뒤 변경 가능해요</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    gap: spacing[20],
  },
  groupCard: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: radius[12],
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  },
  avatarStack: {
    width: 86,
    height: 40,
    position: 'relative',
  },
  avatar: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: gray[200],
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  groupName: {
    ...typography.primary.body1B,
    color: gray[400],
    flex: 1,
  },
  cta: {
    alignSelf: 'stretch',
  },
  changeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[12],
  },
  changeHintText: {
    ...typography.accent.body2,
    color: gray[500],
  },
});
