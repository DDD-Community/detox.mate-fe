import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { AppSelectionView } from './AppSelectionView';
import { useAppSelection } from './useAppSelection';

const { gray, green } = primitiveColors;

export default function SelectAppsScreen() {
  const router = useRouter();
  const selection = useAppSelection({ requireSelection: false });
  const titleColor = useColorScheme() === 'light' ? gray[800] : '#FFFFFF';

  const handleDone = () => {
    const result = selection.saveSelection();
    if (!result) return;
    if (result.addedAppCount > 0) router.replace('/(lock)/goal-time');
    else router.back();
  };

  return (
    <AppSelectionView
      selection={selection.selection}
      onSelectionChange={selection.handleSelectionChange}
      onPermissionDenied={() => router.back()}
      header={
        <View style={styles.header}>
          <View style={styles.headerTexts}>
            <Text style={[styles.title, { color: titleColor }]}>잠글 앱을 선택해 주세요.</Text>
            <Text style={styles.subtitle}>언제든 변경 가능해요.</Text>
          </View>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[24],
    paddingBottom: spacing[16],
  },
  headerTexts: { flex: 1, gap: spacing[8] },
  title: { ...typography.primary.h3 },
  subtitle: { ...typography.primary.body2M, color: gray[400] },
  doneText: { ...typography.primary.body2M, color: green[300] },
});
