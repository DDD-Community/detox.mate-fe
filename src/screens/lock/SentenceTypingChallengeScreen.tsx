import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { fetchGoalChangeChallengeSentence } from './mockSentenceChallenge';

const { gray, system } = primitiveColors;

export interface SentenceTypingChallengeScreenProps {
  title: string;
  instruction: string;
  onConfirm: () => void;
}

/**
 * 목표 시간을 "완화(변경)"하려고 할 때 띄우는 화면. 별도 입력창 박스 없이, 키보드로
 * 입력하는 즉시 문장 자체의 색이 바뀌며 피드백을 준다 — 맞게 입력한 부분은 진하게,
 * 아직 안 친 부분은 흐리게, 틀리게 친 부분은 빨갛게. 전부 맞게 치면 버튼이
 * "취소"에서 "완료하기"로 바뀐다.
 *
 * 커서/선택/돋보기는 직접 그리지 않고 iOS 기본 TextInput 것을 쓴다: 글자만 투명한
 * TextInput을 문장 위에 겹쳐 두어서, 탭/꾹 누르기로 커서를 옮기는 동작이 네이티브 그대로다.
 */
export function SentenceTypingChallengeScreen({
  title,
  instruction,
  onConfirm,
}: SentenceTypingChallengeScreenProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [targetSentence, setTargetSentence] = useState<string | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetchGoalChangeChallengeSentence().then(setTargetSentence);
  }, []);

  useEffect(() => {
    if (targetSentence !== null) inputRef.current?.focus();
  }, [targetSentence]);

  // 배경 문구는 항상 그대로 다 보여준다 — 지금까지 입력한 글자 수만큼만 진하게,
  // 나머지는 흐리게(정답 여부와 무관, 순전히 "몇 글자 쳤는지" 기준). 입력 중 하나라도
  // 틀리면 입력한 글자 전체를 빨간색으로 그 위에 겹쳐 그린다(원래 글자를 지우지 않음).
  // 오타를 지워 다시 일치시키면 겹친 빨간 글씨가 사라지고 배경만 남는다.
  const isValidPrefix = targetSentence !== null && targetSentence.startsWith(input);
  const isComplete = targetSentence !== null && input === targetSentence;
  const typedBackgroundPart = targetSentence?.slice(0, input.length) ?? '';
  const remainingPart = targetSentence?.slice(input.length) ?? '';

  const handleCancel = () => {
    router.dismissTo('/(lock)/restricted-apps');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={handleCancel}>
            <Icon name="caretLeft" size={22} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle}>제한 시간 변경</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.instruction}>{instruction}</Text>

          <View style={styles.sentenceArea}>
            {targetSentence === null ? null : (
              <>
                <Text style={styles.sentenceText}>
                  <Text style={isValidPrefix ? styles.sentenceCorrect : styles.sentenceRemaining}>
                    {typedBackgroundPart}
                  </Text>
                  <Text style={styles.sentenceRemaining}>{remainingPart}</Text>
                </Text>
                {!isValidPrefix ? (
                  <Text style={[styles.sentenceText, styles.sentenceWrongOverlay]}>{input}</Text>
                ) : null}
              </>
            )}

            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              style={[styles.sentenceText, styles.overlayInput]}
              multiline
              scrollEnabled={false}
              submitBehavior="blurAndSubmit"
              contextMenuHidden
              selectionColor={gray[800]}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              editable={targetSentence !== null}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={isComplete ? '목표 시간 변경 완료하기' : '변경 취소'}
            variant="solid"
            color="primary"
            size="lg"
            onPress={isComplete ? onConfirm : handleCancel}
            style={styles.confirmButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    height: 54,
    paddingHorizontal: spacing[16],
  },
  headerTitle: {
    ...typography.primary.title1M,
    color: gray[800],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[24],
    gap: spacing[8],
  },
  title: {
    ...typography.primary.h3,
    color: gray[800],
  },
  instruction: {
    ...typography.primary.body2M,
    color: gray[800],
    marginBottom: spacing[16],
  },
  sentenceArea: {
    width: '100%',
  },
  sentenceText: {
    ...typography.primary.h3,
  },
  sentenceCorrect: {
    color: gray[800],
  },
  sentenceRemaining: {
    color: gray[400],
  },
  sentenceWrongOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    color: system.red.opacity100,
  },
  // 글자는 투명, 커서와 선택 UI만 네이티브로 보인다. 아래 문장 Text와 같은 폰트/패딩 0이라야
  // 줄바꿈 위치가 일치한다.
  overlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    color: 'transparent',
  },
  footer: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  confirmButton: {
    width: '100%',
  },
});
