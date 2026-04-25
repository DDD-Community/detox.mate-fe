import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ScreenTimeAnalyzeTestScreen } from './src/features/screen-time-analyze/ScreenTimeAnalyzeTestScreen';

type InternalScreen = 'menu' | 'screen-time-analyze-test';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<InternalScreen>('menu');

  if (!__DEV__) {
    return null;
  }

  if (currentScreen === 'screen-time-analyze-test') {
    return <ScreenTimeAnalyzeTestScreen onClose={() => setCurrentScreen('menu')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Internal Test Entry</Text>
          <Text style={styles.helper}>
            실제 업로드와 OCR 분석 흐름을 확인해야 할 때만 내부 테스트 화면으로 직접 들어갑니다.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => setCurrentScreen('screen-time-analyze-test')}
          >
            <Text style={styles.buttonText}>스크린타임 분석 테스트 열기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: {
    color: '#f9fafb',
    fontSize: 24,
    fontWeight: '700',
  },
  helper: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
});
