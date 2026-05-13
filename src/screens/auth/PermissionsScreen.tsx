import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/client';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';
import { semanticColors } from '../../lib/token/semantic/colors';

const { gray } = primitiveColors;

export default function PermissionsScreen() {
  const router = useRouter();

  const handleConfirm = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();

    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // 알림은 선택 항목이므로 실패해도 진행
    }

    try {
      const res = await apiClient.get<any[]>('/me/groups');
      const groups = res.data;

      if (groups.length === 0) {
        router.replace('/home');
        return;
      }

      const group = groups[0];
      if (group.members.length >= 2) {
        router.replace('/home');
      } else {
        router.replace(
          `/feed?groupName=${encodeURIComponent(group.name)}&inviteCode=${encodeURIComponent(group.inviteCode)}`
        );
      }
    } catch {
      router.replace('/home');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.backdrop} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.content}>
          <Text style={styles.title}>앱 접근 권한{'\n'}동의가 필요해요</Text>
          <Text style={styles.subtitle}>
            서비스 이용을 위해 아래 권한에{'\n'}동의해 주세요.
          </Text>

          <View style={styles.gap28} />

          <View style={styles.permissionItem}>
            <View style={styles.iconWrapper}>
              <Image
                source={require('../../../assets/onboarding-rg-user.png')}
                style={styles.permissionIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.permissionTextGroup}>
              <Text style={styles.permissionTitle}>사진 및 앨범 (필수)</Text>
              <Text style={styles.permissionDesc}>
                스크린타임 인증 사진 업로드에 사용돼요
              </Text>
            </View>
          </View>

          <View style={styles.gap16} />

          <View style={styles.permissionItem}>
            <View style={styles.iconWrapper}>
              <Image
                source={require('../../../assets/onboarding-rg-bell.png')}
                style={styles.permissionIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.permissionTextGroup}>
              <Text style={styles.permissionTitle}>알림 (선택)</Text>
              <Text style={styles.permissionDesc}>
                인증 독려 및 그룹 활동 알림을 받을 수 있어요
              </Text>
            </View>
          </View>

          <View style={styles.gap32} />

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={styles.confirmText}>동의하고 시작하기</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gray[100],
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: gray[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  title: {
    ...typography.primary.h2,
    color: semanticColors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.primary.body2R,
    color: semanticColors.text.tertiary,
  },
  gap28: { height: 28 },
  gap16: { height: 16 },
  gap32: { height: 32 },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: gray[50],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIcon: {
    width: 22,
    height: 22,
  },
  permissionTextGroup: {
    flex: 1,
    gap: 4,
  },
  permissionTitle: {
    ...typography.primary.body2M,
    color: semanticColors.text.primary,
  },
  permissionDesc: {
    ...typography.primary.caption,
    color: semanticColors.text.secondary,
  },
  confirmButton: {
    backgroundColor: gray[800],
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
});
