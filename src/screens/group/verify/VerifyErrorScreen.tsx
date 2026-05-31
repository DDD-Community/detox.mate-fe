import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { primitiveColors } from '@/lib/token';
import {
  buildVerifyFlowParams,
  getVerifyPath,
  type VerifyMode,
  type VerifyRoot,
} from './verifyFlowParams';

const { green } = primitiveColors;

export default function VerifyErrorScreen() {
  const { mode, goal, groupChallengeParticipantId, verifyRoot } = useLocalSearchParams<{
    mode?: VerifyMode;
    goal?: string;
    groupChallengeParticipantId?: string;
    verifyRoot?: VerifyRoot;
  }>();

  const handleRetake = () => {
    router.replace({
      pathname: getVerifyPath('method', verifyRoot),
      params: buildVerifyFlowParams({ mode, goal, groupChallengeParticipantId, verifyRoot }),
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.alert}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>어제 날짜를 인식할 수 없습니다.</Text>
          <Text style={styles.description}>날짜가 포함되도록 다시 캡쳐해 주세요.</Text>
        </View>
        <Pressable style={styles.button} onPress={handleRetake}>
          <Text style={styles.buttonLabel}>다시 캡쳐하러 가기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    width: 270,
    borderRadius: 14,
    backgroundColor: 'rgba(242, 242, 242, 0.96)',
    overflow: 'hidden',
  },
  textGroup: {
    paddingTop: 19,
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.43,
    color: '#000000',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
    color: '#000000',
    textAlign: 'center',
  },
  button: {
    height: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.43,
    color: green[300],
  },
});
