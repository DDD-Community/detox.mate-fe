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
const ALERT_WIDTH = 270;
const ALERT_HEIGHT = 122;

const iosAlertText = {
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.43,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  action: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.43,
  },
} as const;

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
        <View style={styles.material}>
          <View style={styles.materialBase} />
          <View style={styles.materialDodge} />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.title}>날짜를 인식할 수 없습니다.</Text>
          <Text style={styles.description}>날짜가 포함되게 캡쳐해 주세요.</Text>
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
    width: ALERT_WIDTH,
    height: ALERT_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    paddingTop: 19,
  },
  material: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  materialBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(179, 179, 179, 0.82)',
  },
  materialDodge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
  },
  textGroup: {
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    ...iosAlertText.title,
    color: '#000000',
    textAlign: 'center',
  },
  description: {
    ...iosAlertText.description,
    color: '#000000',
    textAlign: 'center',
  },
  button: {
    height: 44,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    ...iosAlertText.action,
    color: green[300],
  },
});
