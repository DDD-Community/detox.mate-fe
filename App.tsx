import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useScreenTimeImageAnalyze } from './src/features/screen-time-analyze';

function formatRejectReason(reason: string): string {
  switch (reason) {
    case 'screen_not_matched':
      return '스크린타임 화면을 찾지 못했습니다.';
    case 'date_not_yesterday':
      return '요약 날짜가 어제가 아닙니다.';
    case 'summary_date_not_actual_yesterday':
      return '요약 카드의 날짜가 실제 어제 날짜와 다릅니다.';
    case 'summary_date_missing':
      return '요약 카드 날짜를 찾지 못했습니다.';
    case 'usage_not_found':
      return '총 사용시간을 찾지 못했습니다.';
    case 'analysis_failed':
      return '이미지 분석 자체에 실패했습니다.';
    default:
      return reason;
  }
}

export default function App() {
  const {
    analysisResult,
    analyzeImage,
    errorMessage: analyzeErrorMessage,
    isAnalyzing,
    pickImage,
    selectedImageUri,
  } = useScreenTimeImageAnalyze();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Screen Time Analyze</Text>
        <Text style={styles.subtitle}>Apple Vision native OCR + TS parser + hh:mm response</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>실사용 데모</Text>
          <Text style={styles.helper}>
            유저가 업로드한 스크린타임 이미지를 분석하고, `어제` 단어만이 아니라 실제 어제
            날짜까지 맞을 때만 성공으로 처리합니다.
          </Text>
          <View style={styles.controls}>
            <Pressable style={styles.button} onPress={() => void pickImage()}>
              <Text style={styles.buttonText}>이미지 선택</Text>
            </Pressable>
            <Pressable
              disabled={!selectedImageUri || isAnalyzing}
              style={[styles.button, (!selectedImageUri || isAnalyzing) && styles.buttonDisabled]}
              onPress={() => void analyzeImage()}
            >
              <Text style={styles.buttonText}>분석하기</Text>
            </Pressable>
          </View>

          {selectedImageUri ? (
            <Image source={{ uri: selectedImageUri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={[styles.preview, styles.previewPlaceholder]}>
              <Text style={styles.helper}>선택한 이미지가 아직 없습니다.</Text>
            </View>
          )}

          {isAnalyzing ? <Text style={styles.helper}>이미지 분석 중...</Text> : null}
          {analyzeErrorMessage ? <Text style={styles.errorText}>{analyzeErrorMessage}</Text> : null}

          {analysisResult ? (
            <View style={styles.resultPanel}>
              <Text style={styles.cardTitle}>분석 결과</Text>
              {analysisResult.ok ? (
                <>
                  <Text style={styles.resultValue}>{analysisResult.value}</Text>
                  <Text style={styles.meta}>dateLabel: {analysisResult.dateLabel}</Text>
                  <Text style={styles.meta}>rawUsageText: {analysisResult.rawUsageText}</Text>
                  <Text style={styles.meta}>elapsedMs: {analysisResult.elapsedMs}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.errorText}>{formatRejectReason(analysisResult.reason)}</Text>
                  <Text style={styles.meta}>reason: {analysisResult.reason}</Text>
                  {analysisResult.dateLabel ? (
                    <Text style={styles.meta}>dateLabel: {analysisResult.dateLabel}</Text>
                  ) : null}
                  <Text style={styles.meta}>elapsedMs: {analysisResult.elapsedMs}</Text>
                </>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>개발자용 API</Text>
          <Text style={styles.meta}>
            import &#123; analyzeScreenTimeImage &#125; from './api/screenTimeAnalyze'
          </Text>
          <Text style={styles.meta}>const result = await analyzeScreenTimeImage(imageUri)</Text>
          <Text style={styles.meta}>if (result.ok) result.value // "04:02"</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
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
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  resultPanel: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  resultValue: {
    color: '#f9fafb',
    fontSize: 34,
    fontWeight: '700',
  },
});
