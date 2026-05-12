import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';

const { brown, gray, green } = primitiveColors;

const STEP_MINUTES = 10;
const MIN_MINUTES = 30;
const MAX_MINUTES = 24 * 60 - STEP_MINUTES;

const ICONS = {
  caretLeft: require('../../../../assets/icons/regular/icon_rg_CaretLeft.png'),
  info: require('../../../../assets/icons/regular/icon_rg_Info.png'),
  minusCircle: require('../../../../assets/icons/fill/icon_fl_MinusCircle.png'),
  plusCircle: require('../../../../assets/icons/fill/icon_fl_PlusCircle.png'),
} as const;

const formatGoal = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

export default function EditGoalTimeScreen() {
  // TODO: GET /me/usage-goal-times/current 응답으로 초기값 세팅
  const [goalMinutes, setGoalMinutes] = useState(120);
  // TODO: GET /users/me 또는 디바이스 스크린타임으로 채우기
  const myScreenTime = '6h 5m';

  const canDecrease = goalMinutes - STEP_MINUTES >= MIN_MINUTES;
  const canIncrease = goalMinutes + STEP_MINUTES <= MAX_MINUTES;

  const handleDecrease = () => {
    if (!canDecrease) return;
    setGoalMinutes((prev) => prev - STEP_MINUTES);
  };

  const handleIncrease = () => {
    if (!canIncrease) return;
    setGoalMinutes((prev) => prev + STEP_MINUTES);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    // TODO: POST /me/usage-goal-times { totalMinutes: goalMinutes }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Image source={ICONS.caretLeft} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>목표 설정</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <Text style={styles.title}>개인 목표 스크린타임 설정</Text>
        <Text style={styles.subtitle}>2주에 한 번 변경할 수 있어요.</Text>

        <View style={styles.myCard}>
          <Text style={styles.myCardLabel}>내 스크린타임</Text>
          <Text style={styles.myCardValue}>{myScreenTime}</Text>
        </View>

        <View style={styles.pickerWrap}>
          <View style={styles.pickerRow}>
            <Pressable
              onPress={handleDecrease}
              disabled={!canDecrease}
              hitSlop={8}
              style={!canDecrease && styles.disabledIcon}
            >
              <Image
                source={ICONS.minusCircle}
                style={styles.circleIcon}
                resizeMode="contain"
              />
            </Pressable>
            <Text style={styles.timeValue}>{formatGoal(goalMinutes)}</Text>
            <Pressable
              onPress={handleIncrease}
              disabled={!canIncrease}
              hitSlop={8}
              style={!canIncrease && styles.disabledIcon}
            >
              <Image
                source={ICONS.plusCircle}
                style={styles.circleIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
          <Text style={styles.unitLabel}>하루 기준</Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
        <Button
          label="취소"
          color="assistive"
          onPress={handleCancel}
          style={styles.cancelButton}
        />
        <Button
          label="저장하기"
          color="primary"
          onPress={handleSave}
          leadingIcon={
            <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
          }
          trailingIcon={
            <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
          }
          style={styles.saveButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
    marginTop: spacing[12],
  },
  myCard: {
    marginTop: spacing[28],
    backgroundColor: gray[50],
    borderRadius: radius[16],
    padding: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myCardLabel: {
    ...typography.primary.body3R,
    color: gray[500],
  },
  myCardValue: {
    ...typography.primary.body1B,
    color: gray[500],
  },
  pickerWrap: {
    marginTop: spacing[80],
    alignItems: 'center',
    gap: spacing[16],
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  circleIcon: {
    width: 57,
    height: 57,
  },
  disabledIcon: {
    opacity: 0.3,
  },
  timeValue: {
    fontFamily: typography.accent.h2.fontFamily,
    fontSize: 57,
    lineHeight: 57 * 1.3,
    color: '#000000',
    letterSpacing: -1.15,
  },
  unitLabel: {
    ...typography.primary.title1B,
    color: '#000000',
  },
  ctaWrap: {
    flexDirection: 'row',
    gap: spacing[8],
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },
  cancelButton: {
    width: 108,
  },
  saveButton: {
    flex: 1,
  },
  ctaIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
});
