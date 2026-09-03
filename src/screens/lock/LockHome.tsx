import { StyleSheet, Text, View } from 'react-native';

import { primitiveColors, spacing, typography } from '../../lib/token';

export default function LockHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>제한 앱</Text>
      <Text style={styles.subtitle}>화면 잠금 기능은 준비 중이에요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    backgroundColor: '#FFFFFF',
  },
  title: {
    ...typography.primary.title1B,
    color: primitiveColors.gray[900],
  },
  subtitle: {
    ...typography.primary.body2R,
    color: primitiveColors.gray[500],
  },
});
