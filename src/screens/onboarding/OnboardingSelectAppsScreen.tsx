import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { LoggingPage } from '@/components';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { AppSelectionView } from '../lock/AppSelectionView';
import { useAppSelection } from '../lock/useAppSelection';

const { gray, green } = primitiveColors;

export default function OnboardingSelectAppsScreen() {
  const router = useRouter();
  const selection = useAppSelection({ requireSelection: true });
  const titleColor = useColorScheme() === 'light' ? gray[800] : '#FFFFFF';

  const handleDone = () => {
    if (selection.saveSelection()) router.replace('/onboarding-goal');
  };

  return (
    <LoggingPage
      eventName="Onboarding Viewed"
      properties={{ pageName: 'Onboarding', step: 'apps' }}
    >
      <AppSelectionView
        selection={selection.selection}
        onSelectionChange={selection.handleSelectionChange}
        header={
          <View style={styles.header}>
            <View style={styles.headerTexts}>
              <Text style={[styles.title, { color: titleColor }]}>잠글 앱을 선택해 주세요.</Text>
            </View>
            <Pressable
              style={styles.done}
              accessibilityRole="button"
              accessibilityState={{ disabled: !selection.hasSelection }}
              disabled={!selection.hasSelection}
              hitSlop={12}
              onPress={handleDone}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        }
      />
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: 129,
    paddingTop: 66,
    paddingBottom: 31,
    paddingHorizontal: 19,
  },
  headerTexts: { flex: 1, gap: spacing[8] },
  title: { ...typography.primary.h3 },
  done: { position: 'absolute', right: 19, top: 18 },
  doneText: { ...typography.primary.body2M, color: green[300] },
});
