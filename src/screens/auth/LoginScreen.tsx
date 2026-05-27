import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import LOGO_APPLE_LOGIN from '@assets/logo-apple-login.png';
import LOGO_DETOXMATE_BLACK from '@assets/logo-detoxmate-black.png';
import LOGO_KAKAO_LOGIN from '@assets/logo-kakao-login.png';
import TURTLE_HI_IMAGE from '@assets/turtle-hi.png';

import { env } from '@/config/env';
import { primitiveColors, typography } from '@/lib/token';
import { AuthLoginButton } from './AuthLoginButton';
import { TEST_USER_KEYS, TestUserKey, useAuthLogin } from './useAuthLogin';

const { brown, gray } = primitiveColors;

export default function LoginScreen() {
  const { handleKakaoLogin, handleAppleLogin, handleTestLogin, pendingProvider } = useAuthLogin();
  const [testKeyModalVisible, setTestKeyModalVisible] = useState(false);
  const loginPending = Boolean(pendingProvider);
  const showTestLoginButton = env.appEnv === 'development';

  const handleOpenTestKeyModal = () => {
    if (loginPending) return;

    setTestKeyModalVisible(true);
  };

  const handleCloseTestKeyModal = () => {
    if (loginPending) return;

    setTestKeyModalVisible(false);
  };

  const handleSelectTestKey = (testUserKey: TestUserKey) => {
    setTestKeyModalVisible(false);
    handleTestLogin(testUserKey);
  };

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Image source={LOGO_DETOXMATE_BLACK} />
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      </View>

      <View style={styles.imageSection}>
        <Image source={TURTLE_HI_IMAGE} style={styles.turtleImage} resizeMode="contain" />
      </View>

      <View style={styles.buttonSection}>
        <AuthLoginButton
          variant="kakao"
          label="카카오로 시작하기"
          pendingLabel="카카오 로그인 중..."
          iconSource={LOGO_KAKAO_LOGIN}
          onPress={handleKakaoLogin}
          pending={pendingProvider === 'kakao'}
          disabled={loginPending}
        />

        <View style={styles.buttonGap} />

        {showTestLoginButton ? (
          <>
            <AuthLoginButton
              variant="test"
              label="테스트 계정으로 시작하기"
              pendingLabel="테스트 로그인 중..."
              onPress={handleOpenTestKeyModal}
              pending={pendingProvider === 'test'}
              disabled={loginPending}
            />

            <View style={styles.buttonGap} />
          </>
        ) : null}

        <AuthLoginButton
          variant="apple"
          label="애플로 시작하기"
          pendingLabel="애플 로그인 중..."
          iconSource={LOGO_APPLE_LOGIN}
          onPress={handleAppleLogin}
          pending={pendingProvider === 'apple'}
          disabled={loginPending}
        />
      </View>

      {showTestLoginButton ? (
        <Modal
          visible={testKeyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseTestKeyModal}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseTestKeyModal}>
            <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.modalTitle}>테스트 계정 선택</Text>
              <View style={styles.testKeyList}>
                {TEST_USER_KEYS.map((testUserKey) => (
                  <Pressable
                    key={testUserKey}
                    style={styles.testKeyButton}
                    onPress={() => handleSelectTestKey(testUserKey)}
                    disabled={loginPending}
                  >
                    <Text style={styles.testKeyButtonText}>{testUserKey}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 150,
    gap: 10,
  },
  tagline: {
    ...typography.primary.body1R,
    color: gray[600],
    textAlign: 'center',
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turtleImage: {
    width: 260,
    height: 280,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  buttonGap: {
    height: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    ...typography.primary.body1B,
    color: gray[900],
    textAlign: 'center',
  },
  testKeyList: {
    marginTop: 20,
    gap: 10,
  },
  testKeyButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gray[200],
    backgroundColor: gray[50],
    paddingVertical: 14,
  },
  testKeyButtonText: {
    ...typography.primary.body1B,
    color: gray[800],
  },
});
