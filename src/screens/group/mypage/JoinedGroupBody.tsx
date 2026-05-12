import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';
import { WeeklyStatusCard } from './WeeklyStatusCard';

const { gray } = primitiveColors;

const ICONS = {
  caretRight: require('../../../../assets/icons/regular/icon_rg_CaretRight.png'),
  info: require('../../../../assets/icons/regular/icon_rg_Info.png'),
  infoFill: require('../../../../assets/icons/fill/icon_fl_Info.png'),
} as const;

export interface JoinedGroupBodyProps {
  weekLabel: string;
  diffMinutes: number;
  avgScreenTime: string;
  goalScreenTime: string;
  verifiedDays: number;
  totalVerifyDays: number;
  achievedDays: number;
  achievableDays: number;
  groupMembers: { name: string }[];
  groupName: string;
  daysUntilGoalChange: number;
  onGroupPress?: () => void;
  onGoalChangePress?: () => void;
}

function MemberAvatar({ name, offset }: { name: string; offset: number }) {
  return (
    <View style={[styles.avatar, { left: offset }]}>
      <Text style={styles.avatarText} numberOfLines={1}>
        {name}
      </Text>
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
  groupMembers,
  groupName,
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

      <Pressable onPress={onGroupPress} style={styles.groupCard}>
        <View style={styles.groupCardLeft}>
          <View style={styles.avatarStack}>
            {groupMembers.slice(0, 3).map((m, idx) => (
              <MemberAvatar key={`${m.name}-${idx}`} name={m.name} offset={idx * 23} />
            ))}
          </View>
          <Text style={styles.groupName} numberOfLines={1}>
            {groupName}
          </Text>
        </View>
        <Image source={ICONS.caretRight} style={styles.caretIcon} resizeMode="contain" />
      </Pressable>

      <View>
        <Button
          label="목표 스크린타임 변경"
          color="assistive"
          disabled={daysUntilGoalChange > 0}
          onPress={onGoalChangePress}
          leadingIcon={
            <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
          }
          trailingIcon={
            <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
          }
          style={styles.cta}
        />
        {daysUntilGoalChange > 0 ? (
          <View style={styles.changeHintRow}>
            <Image source={ICONS.infoFill} style={styles.hintIcon} resizeMode="contain" />
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
  },
  avatarText: {
    ...typography.primary.body3R,
    color: gray[800],
  },
  groupName: {
    ...typography.primary.body1B,
    color: gray[400],
    flex: 1,
  },
  caretIcon: {
    width: 24,
    height: 24,
  },
  cta: {
    alignSelf: 'stretch',
  },
  ctaIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  changeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[12],
  },
  hintIcon: {
    width: 18,
    height: 18,
  },
  changeHintText: {
    ...typography.accent.body2,
    color: gray[500],
  },
});
