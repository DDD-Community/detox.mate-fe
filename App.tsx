import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useOCRTestHarness } from './src/features/ocr-test/useOCRTestHarness';

export default function App() {
  const {
    currentSuite,
    errorMessage,
    fixtures,
    isRunning,
    runAll,
    runFiveTimes,
    runOnce,
    savedFileUri,
    selectedExpected,
    selectedFixture,
    selectedFixtureId,
    setSelectedFixtureId,
    shareLatestSuite,
  } = useOCRTestHarness();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>OCR Test Harness</Text>
        <Text style={styles.subtitle}>Apple Vision native OCR + TS parser</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fixtures</Text>
          <View style={styles.fixtureList}>
            {fixtures.map((fixture) => {
              const selected = fixture.id === selectedFixtureId;
              return (
                <Pressable
                  key={fixture.id}
                  style={[styles.fixtureChip, selected && styles.fixtureChipSelected]}
                  onPress={() => setSelectedFixtureId(fixture.id)}
                >
                  <Text style={[styles.fixtureChipText, selected && styles.fixtureChipTextSelected]}>
                    {fixture.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Fixture</Text>
          <Text style={styles.meta}>{selectedFixture.label}</Text>
          <Text style={styles.meta}>
            {selectedFixture.uiProfile} / {selectedFixture.locale}
          </Text>
          <Image source={selectedFixture.asset} style={styles.preview} resizeMode="contain" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expected</Text>
          <Text style={styles.meta}>{JSON.stringify(selectedExpected, null, 2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Run Controls</Text>
          <View style={styles.controls}>
            <Pressable disabled={isRunning} style={styles.button} onPress={() => void runOnce()}>
              <Text style={styles.buttonText}>Run once</Text>
            </Pressable>
            <Pressable
              disabled={isRunning}
              style={styles.button}
              onPress={() => void runFiveTimes()}
            >
              <Text style={styles.buttonText}>Run 5 times</Text>
            </Pressable>
            <Pressable disabled={isRunning} style={styles.button} onPress={() => void runAll()}>
              <Text style={styles.buttonText}>Run all</Text>
            </Pressable>
            <Pressable
              disabled={!savedFileUri}
              style={[styles.button, !savedFileUri && styles.buttonDisabled]}
              onPress={() =>
                void shareLatestSuite().then((shared) => {
                  if (!shared) {
                    Alert.alert('Share unavailable', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
                  }
                })
              }
            >
              <Text style={styles.buttonText}>Share latest JSON</Text>
            </Pressable>
          </View>
          <Text style={styles.helper}>
            {isRunning
              ? 'Running OCR...'
              : 'Run once / Run 5 times / Run all 로 실기기 OCR을 반복 측정합니다.'}
          </Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {currentSuite ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest Suite</Text>
            <Text style={styles.meta}>suiteId: {currentSuite.suiteId}</Text>
            <Text style={styles.meta}>mode: {currentSuite.runMode}</Text>
            <Text style={styles.meta}>
              pass: {currentSuite.summary.passedRuns}/{currentSuite.summary.totalRuns}
            </Text>
            <Text style={styles.meta}>saved: {savedFileUri}</Text>
            <Text style={styles.meta}>{JSON.stringify(currentSuite.runs, null, 2)}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Goal</Text>
          <Text style={styles.helper}>
            fixture를 선택하고 실제 iPhone dev build에서 Apple Vision OCR을 호출해 JSON 결과를
            저장합니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: '#d1d5db',
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: 320,
    backgroundColor: '#0f172a',
    borderRadius: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  fixtureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fixtureChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#374151',
  },
  fixtureChipSelected: {
    backgroundColor: '#2563eb',
  },
  fixtureChipText: {
    color: '#d1d5db',
    fontWeight: '600',
  },
  fixtureChipTextSelected: {
    color: '#f9fafb',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  helper: {
    color: '#9ca3af',
    fontSize: 13,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
});
