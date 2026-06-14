import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import LOGO_APPLE_LOGIN from '@assets/logo-apple-login.png';
import LOGO_BLACK from '@assets/logo-black.png';
import LOGO_KAKAO_LOGIN from '@assets/logo-kakao-login.png';
import TURTLE_HI_IMAGE from '@assets/turtle-hi.png';

import { Icon, Toast, useToastVisibility } from '@/components';
import { env } from '@/config/env';
import { primitiveColors, typography } from '@/lib/token';
import { AppAccessPermissionGuideModal } from './AppAccessPermissionGuideModal';
import { AuthLoginButton } from './AuthLoginButton';
import { TEST_USER_KEYS, TestUserKey, useAuthLogin } from './useAuthLogin';

const { brown, gray, system } = primitiveColors;
const LOGIN_FAILURE_MESSAGE = '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
const SESSION_EXPIRED_MESSAGE = '로그인 세션이 만료되었습니다.';
const LOGIN_TOAST_BOTTOM_OFFSET = 204;
const LOGIN_TOAST_WITH_TEST_BOTTOM_OFFSET = 340;

export default function LoginScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const loginToast = useToastVisibility();
  const {
    handleKakaoLogin,
    handleAppleLogin,
    handleTestLogin,
    handleConfirmPermissionGuide,
    pendingProvider,
    permissionGuideConfirming,
    permissionGuideVisible,
  } = useAuthLogin({
    onLoginFailure: () => loginToast.showWithMessage(LOGIN_FAILURE_MESSAGE),
  });
  const [testKeyModalVisible, setTestKeyModalVisible] = useState(false);
  const [testIdModalVisible, setTestIdModalVisible] = useState(false);
  const [testIdInput, setTestIdInput] = useState('');
  const [testIdError, setTestIdError] = useState<string | null>(null);
  const loginPending = Boolean(pendingProvider);
  const showTestLoginButton = env.appEnv === 'development';
  const isSessionExpiredToast = loginToast.message === SESSION_EXPIRED_MESSAGE;

  useEffect(() => {
    if (reason === 'sessionExpired') {
      loginToast.showWithMessage(SESSION_EXPIRED_MESSAGE);
    }
  }, [reason]);

  const handleOpenTestKeyModal = () => {
    if (loginPending) return;

    setTestKeyModalVisible(true);
  };

  const handleOpenTestIdModal = () => {
    if (loginPending) return;

    setTestIdError(null);
    setTestIdModalVisible(true);
  };

  const handleCloseTestKeyModal = () => {
    if (loginPending) return;

    setTestKeyModalVisible(false);
  };

  const handleCloseTestIdModal = () => {
    if (loginPending) return;

    setTestIdModalVisible(false);
    setTestIdError(null);
  };

  const handleSelectTestKey = (testUserKey: TestUserKey) => {
    setTestKeyModalVisible(false);
    handleTestLogin(testUserKey);
  };

  const normalizeTestId = (value: string): TestUserKey | null => {
    const trimmed = value.trim();
    if (!/^\d{1,3}$/.test(trimmed)) return null;

    const testIdNumber = Number(trimmed);
    if (!Number.isInteger(testIdNumber) || testIdNumber < 1 || testIdNumber > 100) return null;

    return `test${testIdNumber}`;
  };

  const handleSubmitTestId = () => {
    if (loginPending) return;

    const testUserKey = normalizeTestId(testIdInput);
    if (!testUserKey) {
      setTestIdError('test1부터 test100까지 입력할 수 있어요.');
      return;
    }

    setTestIdModalVisible(false);
    setTestIdError(null);
    handleTestLogin(testUserKey);
  };

  return (
    <View style={styles.root}>
      <Image source={LOGO_BLACK} style={styles.logoMark} resizeMode="contain" />
      <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      <Image source={TURTLE_HI_IMAGE} style={styles.turtleImage} resizeMode="contain" />

      <View style={styles.buttonSection}>
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

            <AuthLoginButton
              variant="test"
              label="테스트 ID로 시작하기"
              pendingLabel="테스트 로그인 중..."
              onPress={handleOpenTestIdModal}
              pending={pendingProvider === 'test'}
              disabled={loginPending}
            />

            <View style={styles.buttonGap} />
          </>
        ) : null}

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

      <Toast
        visible={loginToast.visible}
        message={loginToast.message}
        bottomOffset={
          showTestLoginButton ? LOGIN_TOAST_WITH_TEST_BOTTOM_OFFSET : LOGIN_TOAST_BOTTOM_OFFSET
        }
        icon={
          <Icon
            name={isSessionExpiredToast ? 'info' : 'warningCircle'}
            size={16}
            weight="fill"
            color={isSessionExpiredToast ? '#FFFFFF' : system.red.opacity100}
          />
        }
      />

      {showTestLoginButton ? (
        <>
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

          <Modal
            visible={testIdModalVisible}
            transparent
            animationType="fade"
            onRequestClose={handleCloseTestIdModal}
          >
            <Pressable style={styles.modalBackdrop} onPress={handleCloseTestIdModal}>
              <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
                <Text style={styles.modalTitle}>테스트 ID 입력</Text>
                <TextInput
                  value={testIdInput}
                  onChangeText={(value) => {
                    setTestIdInput(value.replace(/\D/g, '').slice(0, 3));
                    setTestIdError(null);
                  }}
                  placeholder="1 ~ 100"
                  placeholderTextColor={gray[400]}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  style={styles.testIdInput}
                  onSubmitEditing={handleSubmitTestId}
                />
                {testIdError ? <Text style={styles.testIdError}>{testIdError}</Text> : null}
                <Pressable
                  style={[styles.testIdSubmitButton, loginPending && styles.disabledButton]}
                  onPress={handleSubmitTestId}
                  disabled={loginPending}
                >
                  <Text style={styles.testIdSubmitButtonText}>로그인하기</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : null}

      <AppAccessPermissionGuideModal
        visible={permissionGuideVisible}
        onConfirm={handleConfirmPermissionGuide}
        confirming={permissionGuideConfirming}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  logoMark: {
    position: 'absolute',
    top: 151,
    alignSelf: 'center',
    width: 26,
    height: 25,
  },
  tagline: {
    position: 'absolute',
    top: 196,
    left: 0,
    right: 0,
    ...typography.accent.body1,
    color: gray[800],
    letterSpacing: -0.36,
    textAlign: 'center',
  },
  turtleImage: {
    position: 'absolute',
    top: 316,
    left: 86,
    width: 174,
    height: 231,
  },
  buttonSection: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 60,
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
  testIdInput: {
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gray[200],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    ...typography.primary.body1R,
    color: gray[900],
  },
  testIdError: {
    marginTop: 8,
    ...typography.primary.caption,
    color: system.red.opacity100,
  },
  testIdSubmitButton: {
    height: 52,
    marginTop: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: gray[900],
  },
  disabledButton: {
    opacity: 0.6,
  },
  testIdSubmitButtonText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
});
