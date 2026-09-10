import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { MOCK_APP_CATALOG } from './mockLockApps';

const { gray, green } = primitiveColors;

// iOS FamilyActivityPicker를 흉내낸 임시 화면.
// react-native-device-activity 연동 시 이 화면 전체가 실제 시스템 피커로 교체된다.
const DARK_BG = '#0B0B0C';
const DARK_SURFACE = '#1C1C1E';
const DARK_BORDER = '#2C2C2E';

export default function SelectAppsScreen() {
  const router = useRouter();
  const { selectedAppIds, setSelectedAppIds } = useLockStore();
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedAppIds);

  const toggleApp = (id: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setLocalSelectedIds((prev) =>
      prev.length === MOCK_APP_CATALOG.length ? [] : MOCK_APP_CATALOG.map((app) => app.id)
    );
  };

  const handleDone = () => {
    setSelectedAppIds(localSelectedIds);
    router.push('/(lock)/goal-time');
  };

  const isAllSelected = localSelectedIds.length === MOCK_APP_CATALOG.length;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable hitSlop={8} onPress={handleDone}>
            <Text style={styles.doneLabel}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>잠글 앱을 선택해 주세요.</Text>
          <Text style={styles.subtitle}>언제든 변경 가능해요.</Text>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Pressable style={styles.row} onPress={toggleAll}>
            <View style={styles.rowIconStack}>
              <View style={[styles.appIcon, styles.categoryIcon]} />
            </View>
            <Text style={styles.rowLabel}>All Apps & Categories</Text>
            <CheckMark checked={isAllSelected} />
          </Pressable>

          {MOCK_APP_CATALOG.map((app) => {
            const checked = localSelectedIds.includes(app.id);
            return (
              <Pressable key={app.id} style={styles.row} onPress={() => toggleApp(app.id)}>
                <View style={styles.appIcon}>
                  <Text style={styles.appIconLetter}>{app.name.charAt(0)}</Text>
                </View>
                <Text style={styles.rowLabel}>{app.name}</Text>
                <CheckMark checked={checked} />
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkCircle, checked && styles.checkCircleActive]}>
      {checked ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    height: 44,
  },
  doneLabel: {
    ...typography.primary.body1M,
    color: green[200],
  },
  titleBlock: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[24],
    paddingBottom: spacing[16],
    gap: spacing[8],
  },
  title: {
    ...typography.primary.title1B,
    color: '#FFFFFF',
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing[32],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderTopWidth: 1,
    borderTopColor: DARK_BORDER,
  },
  rowIconStack: {
    width: 32,
    height: 32,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: radius[8],
    backgroundColor: DARK_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    backgroundColor: gray[600],
  },
  appIconLetter: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
  },
  rowLabel: {
    ...typography.primary.body1R,
    color: '#FFFFFF',
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: gray[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#3478F6',
    borderColor: '#3478F6',
  },
});
