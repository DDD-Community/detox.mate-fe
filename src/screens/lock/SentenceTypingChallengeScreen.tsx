import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { fetchGoalChangeChallengeSentence } from './mockSentenceChallenge';

const { gray, system } = primitiveColors;

const CARET_HEIGHT = 26;
const LINE_HEIGHT = typography.primary.h3.lineHeight ?? 36;

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
 * 입력은 글자만 투명한 TextInput을 문장 위에 겹쳐 받고, 커서는 직접 그린다. 탭 위치 → 커서
 * 위치 변환도 네이티브 대신 문장 Text의 줄/글자 폭 측정값으로 직접 계산한다(아래 getIndexFromTap).
 */

interface TextLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type CharStatus = 'correct' | 'wrong' | 'remaining';

/** 같은 상태가 이어지는 글자를 묶어서, 글자마다 Text를 만들지 않게 한다. */
const groupByStatus = (chars: string[], statuses: CharStatus[]) => {
  const runs: { status: CharStatus; text: string }[] = [];
  chars.forEach((char, index) => {
    const status = statuses[index];
    const last = runs[runs.length - 1];
    if (last && last.status === status) last.text += char;
    else runs.push({ status, text: char });
  });
  return runs;
};
export function SentenceTypingChallengeScreen({
  title,
  instruction,
  onConfirm,
}: SentenceTypingChallengeScreenProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [targetSentence, setTargetSentence] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  // 탭으로 커서를 옮길 때만 한 번 쓰는 선택 위치. 네이티브가 반영해서 선택 변경 이벤트가 오면 비운다.
  const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number }>();
  const [isSelectionCollapsed, setIsSelectionCollapsed] = useState(true);
  const [caretLine, setCaretLine] = useState<{ x: number; y: number; height: number } | null>(null);
  const [barWidth, setBarWidth] = useState(0);
  const [targetLines, setTargetLines] = useState<TextLine[]>([]);
  const [charWidths, setCharWidths] = useState<number[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const sentenceAreaRef = useRef<View>(null);
  const blink = useRef(new Animated.Value(1)).current;

  // 커서는 직접 그린다 — 줄 끝에서 공백을 치면 네이티브 커서는 윗줄 끝에 남아 있다가 다음
  // 글자에서야 내려가서 어색하다. 문장 Text와 같은 레이아웃으로 "커서 위치까지의 글자 + 막대"를
  // 보이지 않게 그려 마지막 줄 위치를 재면, 공백 뒤 막대가 다음 줄로 넘어가 커서도 같이 내려간다.
  const textBeforeCaret = input.slice(0, selectionStart);
  // 공백으로 끝날 때만 막대를 붙여 "다음 글자가 놓일 줄"을 잰다. 공백이 아닐 땐 막대를 붙이면
  // 줄 끝 단어가 막대 때문에 통째로 다음 줄로 밀려 커서가 엉뚱한 곳에 찍히므로, 글자만으로 잰다.
  const endsWithSpace = /\s$/.test(textBeforeCaret);
  const handleCaretLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = event.nativeEvent;
    const last = lines[lines.length - 1];
    if (last) {
      setCaretLine({
        x: last.x + last.width - (endsWithSpace ? barWidth : 0),
        y: last.y,
        height: last.height,
      });
    }
  };
  const caretPosition = textBeforeCaret === '' ? { x: 0, y: 0, height: LINE_HEIGHT } : caretLine;

  useEffect(() => {
    blink.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(blink, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(blink, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink, selectionStart, input]);

  useEffect(() => {
    fetchGoalChangeChallengeSentence().then(setTargetSentence);
  }, []);

  // 키보드가 내려가 있을 땐 커서도 숨긴다.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (targetSentence !== null) inputRef.current?.focus();
  }, [targetSentence]);

  // 배경 문구는 항상 그대로 다 보여준다 — 입력한 글자 중 맞게 친 글자만 진하게, 아직 안 쳤거나
  // 틀리게 친 자리는 흐리게. 틀리게 친 글자만 빨간색으로 그 위에 겹쳐 그린다(원래 글자를
  // 지우지 않음). 오타를 지워 다시 일치시키면 빨간 글씨가 사라진다.
  const isComplete = !!targetSentence && input === targetSentence;
  const targetChars = (targetSentence ?? '').split('');
  const inputChars = input.split('');
  const backgroundRuns = groupByStatus(
    targetChars,
    targetChars.map(
      (char, i): CharStatus =>
        i < inputChars.length && inputChars[i] === char ? 'correct' : 'remaining'
    )
  );
  const overlayStatuses = inputChars.map(
    (char, i): CharStatus => (targetChars[i] === char ? 'correct' : 'wrong')
  );
  const hasWrongChar = overlayStatuses.includes('wrong');
  const overlayRuns = groupByStatus(inputChars, overlayStatuses);

  // 탭한 좌표(문장 영역 기준)를 입력 글자 사이의 커서 위치로 바꾼다. 줄 구조는 문장 Text의
  // onTextLayout, 글자 폭은 글자별로 보이지 않게 잰 값을 쓴다. 문장 밖이거나 아직 입력하지 않은
  // 곳을 탭하면 입력한 글자의 맨 끝으로 간다.
  const getIndexFromTap = (x: number, y: number) => {
    const end = input.length;
    const lineLengthSum = targetLines.reduce((sum, line) => sum + line.text.length, 0);
    if (targetLines.length === 0 || charWidths.length < targetChars.length) return end;
    if (lineLengthSum !== targetChars.length) return end;

    let lineStart = 0;
    for (const line of targetLines) {
      const lineLength = line.text.length;
      if (y >= line.y && y < line.y + line.height) {
        let accumulated = line.x;
        for (let offset = 0; offset < lineLength; offset += 1) {
          const width = charWidths[lineStart + offset] ?? 0;
          if (x < accumulated + width / 2) return Math.min(lineStart + offset, end);
          accumulated += width;
        }
        return Math.min(lineStart + lineLength, end);
      }
      lineStart += lineLength;
    }
    return end;
  };

  const handleTapContent = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    sentenceAreaRef.current?.measureInWindow((areaX, areaY) => {
      const index = getIndexFromTap(pageX - areaX, pageY - areaY);
      inputRef.current?.focus();
      setPendingSelection({ start: index, end: index });
      // 코드로 바꾼 선택은 iOS가 선택 변경 이벤트를 보내지 않아서, 그려 주는 커서 위치도 직접 갱신한다.
      setSelectionStart(index);
      setIsSelectionCollapsed(true);
    });
  };

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

        <Pressable style={styles.content} onPress={handleTapContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.instruction}>{instruction}</Text>

          <View ref={sentenceAreaRef} collapsable={false} style={styles.sentenceArea}>
            {targetSentence === null ? null : (
              <>
                <Text
                  style={styles.sentenceText}
                  onTextLayout={(event) => setTargetLines(event.nativeEvent.lines)}
                >
                  {backgroundRuns.map((run, index) => (
                    <Text
                      key={index}
                      style={
                        run.status === 'correct' ? styles.sentenceCorrect : styles.sentenceRemaining
                      }
                    >
                      {run.text}
                    </Text>
                  ))}
                </Text>
                {hasWrongChar ? (
                  <Text style={[styles.sentenceText, styles.sentenceWrongOverlay]}>
                    {overlayRuns.map((run, index) => (
                      <Text
                        key={index}
                        style={run.status === 'wrong' ? styles.wrongChar : styles.transparentChar}
                      >
                        {run.text}
                      </Text>
                    ))}
                  </Text>
                ) : null}
                <View pointerEvents="none" style={styles.charMeasure}>
                  {targetChars.map((char, index) => (
                    <Text
                      key={index}
                      style={styles.sentenceText}
                      onLayout={(event) => {
                        const { width } = event.nativeEvent.layout;
                        setCharWidths((prev) => {
                          if (prev[index] === width) return prev;
                          const next = prev.slice();
                          next[index] = width;
                          return next;
                        });
                      }}
                    >
                      {char}
                    </Text>
                  ))}
                </View>
              </>
            )}

            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              style={[styles.sentenceText, styles.overlayInput]}
              multiline
              pointerEvents="none"
              scrollEnabled={false}
              submitBehavior="blurAndSubmit"
              contextMenuHidden
              selectionColor={gray[800]}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              editable={targetSentence !== null}
              caretHidden
              selection={pendingSelection}
              onSelectionChange={(event) => {
                const { start, end } = event.nativeEvent.selection;
                setSelectionStart(start);
                setPendingSelection(undefined);
                setIsSelectionCollapsed(start === end);
              }}
            />
            <Text
              pointerEvents="none"
              style={[styles.sentenceText, styles.measureText]}
              onTextLayout={handleCaretLayout}
            >
              {endsWithSpace ? `${textBeforeCaret}|` : textBeforeCaret}
            </Text>
            <Text
              pointerEvents="none"
              style={[styles.sentenceText, styles.measureBar]}
              onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            >
              |
            </Text>
            {targetSentence !== null &&
            isKeyboardVisible &&
            isSelectionCollapsed &&
            caretPosition ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.caret,
                  {
                    left: caretPosition.x,
                    top: caretPosition.y + (caretPosition.height - CARET_HEIGHT) / 2,
                    opacity: blink,
                  },
                ]}
              />
            ) : null}
          </View>
        </Pressable>

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
  },
  wrongChar: {
    color: system.red.opacity100,
  },
  transparentChar: {
    color: 'transparent',
  },
  // 글자별 폭 측정용 — 화면에는 보이지 않는다.
  charMeasure: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    opacity: 0,
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
  // 커서 위치 측정용 — 화면에는 보이지 않는다.
  measureText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  measureBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: CARET_HEIGHT,
    borderRadius: 1,
    backgroundColor: gray[800],
  },
  footer: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  confirmButton: {
    width: '100%',
  },
});
