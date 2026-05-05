import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { brown, gray, system } = primitiveColors;
const WHITE = '#FFFFFF';

export default function ActionGuideBanner() {
  const [goalSet, setGoalSet] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      {goalSet ? <DailyAuthBanner /> : <GoalBanner onPress={() => setSheetVisible(true)} />}
      <GoalSettingSheet
        visible={sheetVisible}
        onConfirm={() => {
          setSheetVisible(false);
          setGoalSet(true);
        }}
        onDismiss={() => setSheetVisible(false)}
      />
    </>
  );
}

function GoalBanner({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.goalBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.goalTitle}>디톡스 첫날이신가요?</Text>
          <Text style={styles.goalSubtitle}>내 평균 스크린타임을 업로드해보세요!</Text>
        </View>
        <Image
          source={require('../../../assets/daily-calendar.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
      <Button
        label="목표 설정하기"
        leadingIcon={
          <Image
            source={require('../../../assets/icons/regular/icon_rg_Target.png')}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        }
        color="assistive"
        size="lg"
        onPress={onPress}
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}

function DailyAuthBanner() {
  return (
    <View style={styles.dailyAuthBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.dailyAuthTitle}>오늘의 인증을 잊지 마세요!</Text>
          <Text style={styles.dailyAuthSubtitle}>인증을 못하면 그룹의 연속 기록이 깨져요</Text>
        </View>
        <Image
          source={require('../../../assets/warning.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
      <Button
        label="인증하기"
        leadingIcon={
          <Image
            source={require('../../../assets/icon_fl_Camera.png')}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        }
        color="assistive"
        size="lg"
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}

function GoalSettingSheet({
  visible,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>목표 설정하기</Text>
          <Text style={styles.sheetPlaceholder}>
            목표 설정 화면이 이곳에 들어옵니다.{'\n'}완료 버튼을 눌러 목표 설정을 완료하세요.
          </Text>
          <Button label="완료" onPress={onConfirm} style={{ alignSelf: 'stretch' }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  goalBanner: {
    backgroundColor: brown[100],
    borderRadius: radius[16],
    padding: spacing[20],
    gap: spacing[12],
  },
  dailyAuthBanner: {
    backgroundColor: system.red.opacity100,
    borderRadius: radius[16],
    padding: spacing[20],
    gap: spacing[12],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  textContainer: {
    flex: 1,
    gap: spacing[4],
  },
  goalTitle: {
    ...typography.primary.body1B,
    color: gray[900],
  },
  goalSubtitle: {
    ...typography.primary.body2R,
    color: gray[600],
  },
  dailyAuthTitle: {
    ...typography.primary.body1B,
    color: WHITE,
  },
  dailyAuthSubtitle: {
    ...typography.primary.body2R,
    color: WHITE,
  },
  bannerImage: {
    width: 64,
    height: 64,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: radius[16],
    borderTopRightRadius: radius[16],
    padding: spacing[24],
    paddingBottom: spacing[40],
    gap: spacing[16],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: gray[200],
    borderRadius: 2,
    alignSelf: 'center',
  },
  sheetTitle: {
    ...typography.primary.body1B,
    color: gray[900],
    textAlign: 'center',
  },
  sheetPlaceholder: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
    paddingVertical: spacing[24],
  },
});
